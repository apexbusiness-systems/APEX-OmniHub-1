-- ============================================================================
-- ROLLBACK: 20260928020000_activation_rpc_business_free_tiers.sql (WP-01)
-- Restores the 5 original policies, the original CHECK and the previous RPC
-- body verbatim. WARNING: restoring CHECK (tier IN ('BASIC','PRO')) FAILS while
-- any user_entitlements row has tier = 'BUS'; migrate those rows first.
-- ============================================================================

-- additive-allow: DROP_POLICY re-create with only the paid-access term replaced (D1 option a)
DROP POLICY IF EXISTS "Admins and paid users manage incidents" ON public.omnidash_incidents;
CREATE POLICY "Admins and paid users manage incidents" ON public.omnidash_incidents
    FOR ALL TO authenticated
    USING ((public.is_admin(auth.uid()) OR public.is_paid_user(auth.uid())) AND (user_id = auth.uid()))
    WITH CHECK ((public.is_admin(auth.uid()) OR public.is_paid_user(auth.uid())) AND (user_id = auth.uid()));

-- additive-allow: DROP_POLICY re-create with only the paid-access term replaced (D1 option a)
DROP POLICY IF EXISTS "Admins and paid users manage KPI daily" ON public.omnidash_kpi_daily;
CREATE POLICY "Admins and paid users manage KPI daily" ON public.omnidash_kpi_daily
    FOR ALL TO authenticated
    USING ((public.is_admin(auth.uid()) OR public.is_paid_user(auth.uid())) AND (user_id = auth.uid()))
    WITH CHECK ((public.is_admin(auth.uid()) OR public.is_paid_user(auth.uid())) AND (user_id = auth.uid()));

-- additive-allow: DROP_POLICY re-create with only the paid-access term replaced (D1 option a)
DROP POLICY IF EXISTS "Admins and paid users manage pipeline items" ON public.omnidash_pipeline_items;
CREATE POLICY "Admins and paid users manage pipeline items" ON public.omnidash_pipeline_items
    FOR ALL TO authenticated
    USING ((public.is_admin(auth.uid()) OR public.is_paid_user(auth.uid())) AND (user_id = auth.uid()))
    WITH CHECK ((public.is_admin(auth.uid()) OR public.is_paid_user(auth.uid())) AND (user_id = auth.uid()));

-- additive-allow: DROP_POLICY re-create with only the paid-access term replaced (D1 option a)
DROP POLICY IF EXISTS "Admins and paid users manage omnidash_settings" ON public.omnidash_settings;
CREATE POLICY "Admins and paid users manage omnidash_settings" ON public.omnidash_settings
    FOR ALL TO authenticated
    USING ((public.is_admin(auth.uid()) OR public.is_paid_user(auth.uid())) AND (user_id = auth.uid()))
    WITH CHECK ((public.is_admin(auth.uid()) OR public.is_paid_user(auth.uid())) AND (user_id = auth.uid()));

-- additive-allow: DROP_POLICY re-create with only the paid-access term replaced (D1 option a)
DROP POLICY IF EXISTS "Admins and paid users manage today items" ON public.omnidash_today_items;
CREATE POLICY "Admins and paid users manage today items" ON public.omnidash_today_items
    FOR ALL TO authenticated
    USING ((public.is_admin(auth.uid()) OR public.is_paid_user(auth.uid())) AND (user_id = auth.uid()))
    WITH CHECK ((public.is_admin(auth.uid()) OR public.is_paid_user(auth.uid())) AND (user_id = auth.uid()));

DO $$
DECLARE
    c RECORD;
BEGIN
    FOR c IN
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'public.user_entitlements'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%tier%'
    LOOP
        EXECUTE format('ALTER TABLE public.user_entitlements DROP CONSTRAINT %I', c.conname);
    END LOOP;
    ALTER TABLE public.user_entitlements
        ADD CONSTRAINT user_entitlements_tier_check CHECK (tier IN ('BASIC', 'PRO'));
END $$;

CREATE OR REPLACE FUNCTION public.activate_client_subscription(
    p_user_id UUID,
    p_tier TEXT,
    p_skills JSONB,
    p_stripe_customer_id TEXT DEFAULT NULL,
    p_stripe_subscription_id TEXT DEFAULT NULL,
    p_current_period_start TIMESTAMPTZ DEFAULT NULL,
    p_current_period_end TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_subscription_tier public.subscription_tier;
    v_subscription_status public.subscription_status;
    v_entitlement_record RECORD;
    v_subscription_record RECORD;
BEGIN
    -- Fail closed unless PostgREST/Supabase authenticated the caller as
    -- service_role. SECURITY DEFINER changes current_user to the function owner,
    -- so auth.role() is the trusted invoker signal here.
    IF COALESCE(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'activate_client_subscription requires service_role';
    END IF;

    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'p_user_id cannot be null';
    END IF;

    IF p_tier NOT IN ('BASIC', 'PRO') THEN
        RAISE EXCEPTION 'Invalid tier. Must be BASIC or PRO.';
    END IF;

    IF p_tier = 'PRO' THEN
        v_subscription_tier := 'pro'::public.subscription_tier;
    ELSE
        v_subscription_tier := 'starter'::public.subscription_tier;
    END IF;

    v_subscription_status := 'active'::public.subscription_status;

    INSERT INTO public.user_entitlements (
        user_id,
        tier,
        active_skills,
        onboarding_completed_at,
        updated_at
    )
    VALUES (
        p_user_id,
        p_tier,
        COALESCE(p_skills, '[]'::jsonb),
        now(),
        now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        tier = EXCLUDED.tier,
        active_skills = EXCLUDED.active_skills,
        onboarding_completed_at = COALESCE(public.user_entitlements.onboarding_completed_at, EXCLUDED.onboarding_completed_at),
        updated_at = EXCLUDED.updated_at
    RETURNING id INTO v_entitlement_record;

    INSERT INTO public.subscriptions (
        user_id,
        tier,
        status,
        stripe_customer_id,
        stripe_subscription_id,
        current_period_start,
        current_period_end
    )
    VALUES (
        p_user_id,
        v_subscription_tier,
        v_subscription_status,
        p_stripe_customer_id,
        p_stripe_subscription_id,
        p_current_period_start,
        p_current_period_end
    )
    ON CONFLICT (user_id) DO UPDATE SET
        tier = EXCLUDED.tier,
        status = EXCLUDED.status,
        stripe_customer_id = EXCLUDED.stripe_customer_id,
        stripe_subscription_id = EXCLUDED.stripe_subscription_id,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end
    RETURNING id INTO v_subscription_record;

    RETURN jsonb_build_object(
        'success', true,
        'entitlement_id', v_entitlement_record.id,
        'subscription_id', v_subscription_record.id
    );
END;
$$;

-- additive-allow: REVOKE SECURITY FIX: entitlement activation must not remain executable by broad default roles.
REVOKE ALL ON FUNCTION public.activate_client_subscription(UUID, TEXT, JSONB, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
-- additive-allow: REVOKE SECURITY FIX: anonymous callers must not activate subscriptions through SECURITY DEFINER RPC.
REVOKE EXECUTE ON FUNCTION public.activate_client_subscription(UUID, TEXT, JSONB, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) FROM anon;
-- additive-allow: REVOKE SECURITY FIX: authenticated users must activate only through the server-side Edge Function.
REVOKE EXECUTE ON FUNCTION public.activate_client_subscription(UUID, TEXT, JSONB, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.activate_client_subscription(UUID, TEXT, JSONB, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;
