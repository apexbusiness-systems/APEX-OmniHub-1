import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ACCESS_REQUEST_SUBMIT_FAILED,
  ANON_FORM_CLIENT_OPTIONS,
  submitAccessRequest,
  type AccessRequestRow,
} from '../apps/omnihub-site/src/lib/accessRequestSubmit';

// APEX-REV-2026-09 WP-05 (F-09): repeat submissions must succeed, the form must
// submit as anon, and raw database text must never reach the caller.
const ROW: AccessRequestRow = { email: 'lead@example.com', name: 'Lead', company: null, use_case: null };

function fakeClient(result: { error: unknown }) {
  const upsert = vi.fn().mockResolvedValue(result);
  const from = vi.fn().mockReturnValue({ upsert });
  return { client: { from } as unknown as Pick<SupabaseClient, 'from'>, from, upsert };
}

describe('submitAccessRequest', () => {
  it('upserts with ON CONFLICT (email) DO NOTHING semantics', async () => {
    const { client, from, upsert } = fakeClient({ error: null });
    await expect(submitAccessRequest(client, ROW)).resolves.toBeUndefined();
    expect(from).toHaveBeenCalledWith('access_requests');
    expect(upsert).toHaveBeenCalledWith(ROW, { onConflict: 'email', ignoreDuplicates: true });
  });

  it('throws an opaque error that never contains raw database text', async () => {
    const raw = 'new row violates row-level security policy for table "access_requests"';
    const { client } = fakeClient({ error: { message: raw, code: '42501', details: raw, hint: raw } });
    const failure = await submitAccessRequest(client, ROW).catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toBe(ACCESS_REQUEST_SUBMIT_FAILED);
    expect(JSON.stringify(failure)).not.toContain('row-level security');
  });
});

describe('Request Access form client', () => {
  it('never loads or refreshes a signed-in session (RLS grants INSERT to anon only)', () => {
    expect(ANON_FORM_CLIENT_OPTIONS.auth).toEqual({
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    });
  });

  it('wires the anon options and opaque submit into the page', () => {
    const page = readFileSync(resolve(process.cwd(), 'apps/omnihub-site/src/pages/RequestAccess.tsx'), 'utf8');
    expect(page).toContain('ANON_FORM_CLIENT_OPTIONS');
    expect(page).toContain('await submitAccessRequest(supabase, {');
    expect(page).not.toMatch(/throw new Error\(error\.message\)/);
    expect(page).not.toMatch(/\.from\('access_requests'\)\.upsert\(/);
  });
});
