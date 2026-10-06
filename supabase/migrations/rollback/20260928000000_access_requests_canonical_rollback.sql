-- ============================================================================
-- ROLLBACK: 20260928000000_access_requests_canonical.sql (WP-05)
-- ============================================================================
-- The forward migration is additive and converges on the app-local schema, so
-- rollback only restores the previous trigger-function body (no pinned
-- search_path). Policies, indexes and grants are identical to the app-local
-- migration and are left in place.
--
-- The table is intentionally NOT dropped: it holds production leads, and data
-- deletion requires explicit owner approval (contract N5). If the owner
-- approves removal, export the rows first, then run manually:
--   DROP TABLE IF EXISTS public.access_requests;
--   DROP FUNCTION IF EXISTS public.update_access_requests_updated_at();
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_access_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.request_count = OLD.request_count + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- CREATE OR REPLACE re-assigns all properties except owner/grants, so the
-- pinned search_path from the forward migration is cleared here.
