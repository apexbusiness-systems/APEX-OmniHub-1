-- ============================================================================
-- MIGRATION B: audit_logs — revoke client INSERT (AUD-1b)
-- Contract: APEX-REV-2026-09; owner decision 2026-09-29 (AUD-1, split in two)
-- Date: 2026-09-29
-- ============================================================================
-- Signed-in users could insert their own audit_logs rows directly, which made the
-- trail writable by the people it describes. From this migration:
--   * authenticated and anon can no longer INSERT into public.audit_logs;
--   * the service role keeps its own INSERT policy (edge functions, orchestrator);
--   * the browser records its events through public.record_client_audit_event()
--     (migration 20260929000000), which is what AUD-1b's web build calls.
-- The read policy ("Users can view own audit logs") is unchanged.
--
-- ORDER: apply migration 20260929000000 first, and ship the AUD-1b web build before
-- or with this migration. The guard below refuses to run when the function is
-- missing, so the browser never ends up with neither write path.
-- After this migration, browser tabs opened before the web build (which still insert
-- directly) lose their client audit events until they reload; nothing else changes.
-- Idempotent: DROP POLICY IF EXISTS and REVOKE can be re-run safely.
-- ROLLBACK: supabase/migrations/rollback/20260929000100_audit_logs_revoke_client_insert_rollback.sql
-- ============================================================================

DO $$
BEGIN
  IF to_regprocedure('public.record_client_audit_event(uuid,text,text,text,jsonb)') IS NULL THEN
    RAISE EXCEPTION 'apply migration 20260929000000 (record_client_audit_event) before this one'
      USING ERRCODE = '55000';
  END IF;
END
$$;

-- additive-allow: DROP_POLICY authenticated users may no longer insert audit rows directly; writes go through the service role or record_client_audit_event (AUD-1b)
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_logs;

-- additive-allow: REVOKE table-level INSERT for client roles is the point of AUD-1b; the service role keeps its INSERT policy
REVOKE INSERT ON public.audit_logs FROM authenticated, anon;
