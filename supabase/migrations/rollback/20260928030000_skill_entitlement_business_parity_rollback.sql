-- ROLLBACK: 20260928030000 — restores the live pre-WP-03 definitions verbatim.

CREATE OR REPLACE FUNCTION public.check_skill_entitlement(user_uuid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
DECLARE current_count integer; max_limit integer; user_tier text;
BEGIN
  IF auth.role() <> 'service_role' AND auth.uid() IS DISTINCT FROM user_uuid THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
  SELECT count(*) INTO current_count FROM public.user_generated_skills WHERE user_id=user_uuid AND is_active=true;
  SELECT tier INTO user_tier FROM public.user_entitlements WHERE user_id=user_uuid LIMIT 1;
  user_tier := coalesce(user_tier, 'BASIC'); max_limit := CASE WHEN user_tier='PRO' THEN 999999 ELSE 5 END;
  RETURN jsonb_build_object('allowed',current_count<max_limit,'current',current_count,'max',max_limit,'tier',user_tier);
END $function$;

CREATE OR REPLACE FUNCTION public.enforce_skill_entitlement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_count INTEGER;
    max_limit INTEGER;
    user_tier TEXT;
BEGIN
    -- Inactive skills do not count toward the entitlement cap
    IF NEW.is_active IS DISTINCT FROM true THEN
        RETURN NEW;
    END IF;

    -- Serialize concurrent inserts/activations for this user within the
    -- transaction (released automatically at COMMIT/ROLLBACK)
    PERFORM pg_advisory_xact_lock(
        hashtextextended('user_generated_skills:' || NEW.user_id::text, 0)
    );

    -- Count existing active skills (exclude the row itself for UPDATEs)
    SELECT COUNT(*) INTO current_count
    FROM public.user_generated_skills
    WHERE user_id = NEW.user_id
      AND is_active = true
      AND id <> NEW.id;

    -- Get tier from user_entitlements (default to BASIC if not found)
    SELECT tier INTO user_tier
    FROM public.user_entitlements
    WHERE user_id = NEW.user_id
    LIMIT 1;

    IF user_tier IS NULL THEN
        user_tier := 'BASIC';
    END IF;

    -- BASIC = 5 free generations, PRO = 999999 (effectively unlimited)
    IF user_tier = 'PRO' THEN
        max_limit := 999999;
    ELSE
        max_limit := 5;
    END IF;

    IF current_count >= max_limit THEN
        RAISE EXCEPTION 'LIMIT_REACHED: skill cap (%) reached for tier %',
            max_limit, user_tier;
    END IF;

    RETURN NEW;
END;
$function$;

-- additive-allow: REVOKE Security hardening on trigger function re-applied after replace.
REVOKE EXECUTE ON FUNCTION public.enforce_skill_entitlement()
  FROM PUBLIC, anon, authenticated;
