-- ============================================================================
-- ROLLBACK: 20260929000000_record_client_audit_event.sql (AUD-1a)
-- Removes the browser audit writer. Nothing else changes: migration A touches no
-- table privilege and no policy. Do not run this while the AUD-1b web build is live
-- or after migration 20260929000100 has been applied (browsers would then have
-- neither the function nor the direct insert); roll back 20260929000100 first.
-- ============================================================================

DROP FUNCTION IF EXISTS public.record_client_audit_event(uuid, text, text, text, jsonb);
