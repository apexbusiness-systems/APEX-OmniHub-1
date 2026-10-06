-- ============================================================================
-- MIGRATION: New-lead alert trigger on public.access_requests
-- Contract: APEX-REV-2026-09 WP-05 (F-10) — owner chose the existing Resend channel.
-- Date: 2026-09-28
-- ============================================================================
-- AFTER INSERT → pg_net POST to the notify-access-request edge function,
-- authenticated with the vault `cron_shared_secret` (same pattern as
-- dispatch_scheduled_workflows). Fire-and-forget: any failure raises a
-- WARNING and the lead insert always succeeds.
--
-- IDEMPOTENT: CREATE OR REPLACE FUNCTION; DROP TRIGGER IF EXISTS before CREATE.
-- ROLLBACK: supabase/migrations/rollback/20260928010000_access_requests_lead_alert_rollback.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_access_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  project_url TEXT;
  cron_secret TEXT;
BEGIN
  BEGIN
    SELECT decrypted_secret INTO project_url
      FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;
    SELECT decrypted_secret INTO cron_secret
      FROM vault.decrypted_secrets WHERE name = 'cron_shared_secret' LIMIT 1;

    IF project_url IS NULL OR btrim(project_url) = '' OR cron_secret IS NULL THEN
      RAISE WARNING 'notify_access_request: vault project_url/cron_shared_secret missing; alert skipped';
      RETURN NEW;
    END IF;

    PERFORM net.http_post(
      url := rtrim(btrim(project_url), '/') || '/functions/v1/notify-access-request',
      headers := jsonb_build_object('Content-Type', 'application/json', 'X-Cron-Secret', cron_secret),
      body := jsonb_build_object('id', NEW.id)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_access_request: alert dispatch failed (%); lead kept', SQLSTATE;
  END;
  RETURN NEW;
END;
$$;

-- additive-allow: REVOKE least-privilege lock on a new SECURITY DEFINER trigger function
REVOKE ALL ON FUNCTION public.notify_access_request() FROM PUBLIC, anon, authenticated;

-- additive-allow: DROP_TRIGGER idempotent re-create of this migration's own trigger
DROP TRIGGER IF EXISTS access_requests_lead_alert_trigger ON public.access_requests;
CREATE TRIGGER access_requests_lead_alert_trigger
    AFTER INSERT ON public.access_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_access_request();
