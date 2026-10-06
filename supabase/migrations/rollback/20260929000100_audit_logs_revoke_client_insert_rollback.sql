-- ============================================================================
-- ROLLBACK: 20260929000100_audit_logs_revoke_client_insert.sql (AUD-1b)
-- Restores direct INSERT for signed-in users (policy and table privilege exactly
-- as created by 20251218000000 and the default grants). The function from
-- migration A is left in place; drop it separately with its own rollback.
-- ============================================================================

GRANT INSERT ON public.audit_logs TO authenticated, anon;

-- additive-allow: DROP_POLICY restore the original insert policy verbatim (20251218000000)
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert own audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);
