/**
 * Access-request persistence for the Request Access form (APEX-REV-2026-09 WP-05, F-09).
 *
 * - Submits as the `anon` role only: `public.access_requests` RLS grants INSERT
 *   to `anon`, so the form client must never load a signed-in visitor's stored
 *   session (that would run the insert as `authenticated` and be rejected).
 * - Idempotent on email: `ignoreDuplicates` compiles to
 *   `ON CONFLICT (email) DO NOTHING`, which the INSERT-only policy allows, so a
 *   repeat submission succeeds instead of hitting the denied UPDATE path.
 * - Never propagates raw database text: failures throw an opaque error that the
 *   page maps to its fixed user-facing message.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AccessRequestRow {
  email: string;
  name: string;
  company: string | null;
  use_case: string | null;
}

/** Client options for the form: no session persistence, refresh, or URL session detection. */
export const ANON_FORM_CLIENT_OPTIONS = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
} as const;

export const ACCESS_REQUEST_SUBMIT_FAILED = 'ACCESS_REQUEST_SUBMIT_FAILED';

export async function submitAccessRequest(
  client: Pick<SupabaseClient, 'from'>,
  row: AccessRequestRow
): Promise<void> {
  const { error } = await client
    .from('access_requests')
    .upsert(row, { onConflict: 'email', ignoreDuplicates: true });

  if (error) {
    throw new Error(ACCESS_REQUEST_SUBMIT_FAILED);
  }
}
