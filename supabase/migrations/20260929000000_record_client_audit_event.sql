-- ============================================================================
-- MIGRATION A: record_client_audit_event() (AUD-1a, additive)
-- Contract: APEX-REV-2026-09; owner decision 2026-09-29 (AUD-1, split in two)
-- Date: 2026-09-29
-- ============================================================================
-- Adds the server-side writer that the browser will use for its own audit events.
-- Additive only: this migration changes no table privilege and no policy, so the
-- current direct browser insert keeps working. The switch and the revoke follow in
-- AUD-1b (migration 20260929000100).
--
-- The function is SECURITY DEFINER and:
--   * takes the actor from auth.uid() (the caller cannot name an actor or a time);
--   * allow-lists the action type (six browser-observed events);
--   * caps metadata at 2 KB (larger payloads become a truncation marker) and tags
--     the row source = 'client', overriding any caller-supplied value;
--   * throttles to 60 events per minute per actor and type, serialised under an
--     advisory lock, and drops (returns false) over the limit instead of erroring;
--   * is idempotent on the client-supplied id (ON CONFLICT DO NOTHING).
-- Execute is granted to authenticated only. The one REVOKE below is on this new
-- function's own default execute grant (PUBLIC, anon); no table is touched.
-- Idempotent: CREATE OR REPLACE and GRANT can be re-run safely.
-- ROLLBACK: supabase/migrations/rollback/20260929000000_record_client_audit_event_rollback.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION public.record_client_audit_event(
  p_id uuid,
  p_action_type text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_meta jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_recent integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;

  IF p_action_type IS NULL OR p_action_type NOT IN (
    'login',
    'logout',
    'omnidash.settings.updated',
    'omnilink.port.request',
    'omnilink.port.failure',
    'omnilink.port.disabled'
  ) THEN
    RAISE EXCEPTION 'audit action type not permitted' USING ERRCODE = '42501';
  END IF;

  -- Serialise the throttle check per actor and type so concurrent calls cannot
  -- both pass it. The lock is released at the end of the transaction.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text || ':' || p_action_type, 0));

  SELECT count(*) INTO v_recent
  FROM public.audit_logs
  WHERE actor_id = v_uid
    AND action_type = p_action_type
    AND created_at > now() - interval '1 minute';

  -- Over the limit: drop the event without an error so the browser does not retry.
  IF v_recent >= 60 THEN
    RETURN false;
  END IF;

  IF jsonb_typeof(v_meta) <> 'object' THEN
    v_meta := jsonb_build_object('value', v_meta);
  END IF;
  IF octet_length(v_meta::text) > 2048 THEN
    v_meta := jsonb_build_object('truncated', true, 'bytes', octet_length(v_meta::text));
  END IF;
  -- The server-set source key wins over any caller-supplied key of the same name.
  v_meta := v_meta || jsonb_build_object('source', 'client');

  INSERT INTO public.audit_logs (id, actor_id, action_type, resource_type, resource_id, metadata)
  VALUES (
    coalesce(p_id, gen_random_uuid()),
    v_uid,
    p_action_type,
    left(p_resource_type, 64),
    left(p_resource_id, 256),
    v_meta
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.record_client_audit_event(uuid, text, text, text, jsonb) IS
  'Browser audit writer (AUD-1). Actor = auth.uid(); allow-listed action types; 2 KB metadata cap; 60 events per minute per actor and type; source = client.';

-- additive-allow: REVOKE limited to this new function's own default execute grant; anon and PUBLIC must not call the audit writer, no table privilege is touched (AUD-1a)
REVOKE ALL ON FUNCTION public.record_client_audit_event(uuid, text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_client_audit_event(uuid, text, text, text, jsonb) TO authenticated;
