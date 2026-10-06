-- ============================================================================
-- MIGRATION: Canonical public.access_requests (lead capture)
-- Contract: APEX-REV-2026-09 WP-05 (F-08, F-09)
-- Date: 2026-09-28
-- ============================================================================
-- F-08: the table was only defined in the app-local migration
-- apps/omnihub-site/supabase/migrations/20250111000000_create_access_requests.sql,
-- which is not in the deployed root migration chain. This migration makes the
-- root chain authoritative with the identical schema and policies.
--
-- IDEMPOTENT: safe on a database where the app-local migration already ran
-- (CREATE ... IF NOT EXISTS, DROP POLICY/TRIGGER IF EXISTS before CREATE,
-- CREATE OR REPLACE FUNCTION). No existing rows are read, updated or deleted.
--
-- F-09: the site now submits with ON CONFLICT (email) DO NOTHING, which only
-- needs the anon INSERT policy below; the UPDATE path stays denied.
--
-- ROLLBACK: supabase/migrations/rollback/20260928000000_access_requests_canonical_rollback.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.access_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    company TEXT,
    use_case TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    request_count INTEGER DEFAULT 1 NOT NULL,

    CONSTRAINT access_requests_email_key UNIQUE (email),
    CONSTRAINT access_requests_email_check CHECK (
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
    CONSTRAINT access_requests_name_length CHECK (
        char_length(name) >= 1 AND char_length(name) <= 100
    ),
    CONSTRAINT access_requests_email_length CHECK (
        char_length(email) >= 5 AND char_length(email) <= 254
    ),
    CONSTRAINT access_requests_company_length CHECK (
        company IS NULL OR char_length(company) <= 100
    ),
    CONSTRAINT access_requests_use_case_length CHECK (
        use_case IS NULL OR char_length(use_case) <= 500
    )
);

-- Kept identical to the app-local schema so both origins converge.
CREATE INDEX IF NOT EXISTS access_requests_email_idx
    ON public.access_requests (email);

CREATE INDEX IF NOT EXISTS access_requests_created_at_idx
    ON public.access_requests (created_at DESC);

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Anon may insert; reads/updates/deletes are denied (admin uses service role).
-- additive-allow: DROP_POLICY idempotent re-create of the identical app-local policy (no semantic change)
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.access_requests;
CREATE POLICY "Allow anonymous inserts"
    ON public.access_requests
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- additive-allow: DROP_POLICY idempotent re-create of the identical app-local policy (no semantic change)
DROP POLICY IF EXISTS "Deny anonymous reads" ON public.access_requests;
CREATE POLICY "Deny anonymous reads"
    ON public.access_requests
    FOR SELECT
    TO anon
    USING (false);

-- additive-allow: DROP_POLICY idempotent re-create of the identical app-local policy (no semantic change)
DROP POLICY IF EXISTS "Deny anonymous updates" ON public.access_requests;
CREATE POLICY "Deny anonymous updates"
    ON public.access_requests
    FOR UPDATE
    TO anon
    USING (false);

-- additive-allow: DROP_POLICY idempotent re-create of the identical app-local policy (no semantic change)
DROP POLICY IF EXISTS "Deny anonymous deletes" ON public.access_requests;
CREATE POLICY "Deny anonymous deletes"
    ON public.access_requests
    FOR DELETE
    TO anon
    USING (false);

-- Same body as the app-local function, plus a pinned search_path
-- (Supabase advisor: function_search_path_mutable).
CREATE OR REPLACE FUNCTION public.update_access_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.request_count = OLD.request_count + 1;
    RETURN NEW;
END;
$$;

-- additive-allow: DROP_TRIGGER idempotent re-create of the identical app-local trigger (no semantic change)
DROP TRIGGER IF EXISTS access_requests_updated_at_trigger ON public.access_requests;
CREATE TRIGGER access_requests_updated_at_trigger
    BEFORE UPDATE ON public.access_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_access_requests_updated_at();

GRANT INSERT ON public.access_requests TO anon;

COMMENT ON TABLE public.access_requests IS
    'Early access request submissions from marketing site. Idempotent on email.';
COMMENT ON COLUMN public.access_requests.email IS
    'Unique email address - used as idempotency key for upserts';
COMMENT ON COLUMN public.access_requests.request_count IS
    'Number of times this email has submitted a request';
COMMENT ON COLUMN public.access_requests.updated_at IS
    'Last request timestamp (auto-updated on upsert)';
