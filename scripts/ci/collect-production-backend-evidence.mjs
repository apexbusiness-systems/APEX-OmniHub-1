#!/usr/bin/env node
/**
 * collect-production-backend-evidence — data-layer live production evidence.
 *
 * WHY THIS EXISTS: the browser-based production-safe specs are the certifying
 * path, but they need browser egress. Where that is unavailable (this runner
 * resets every HTTPS CONNECT tunnel; see APEX-2031) the auth and persistence
 * claims can still be exercised directly against the live Supabase project,
 * which is where the truth actually lives.
 *
 * WHAT IT CAN AND CANNOT PROVE — read before citing it:
 *   CAN: that email/password auth really issues a session; that the issued JWT
 *        claims role=authenticated and never service_role; that sign-out really
 *        revokes the refresh token server-side; that an anonymous client is
 *        denied by RLS; that an authenticated write is durably persisted and
 *        readable back from a brand-new client connection.
 *   CANNOT: anything about the deployed web application — no protected-route
 *        render, no UI sign-out, no OmniDash surface. And with a single tenant
 *        it cannot prove cross-tenant isolation, which is what
 *        SUPABASE_RLS_MULTI_TENANT actually requires.
 *
 * Every record it writes carries certifies:false. It is corroboration for the
 * browser specs, never a substitute for them.
 *
 * NON-DESTRUCTIVE: the only write is one additive, test-scoped row using the
 * reserved .invalid TLD (RFC 2606), which this script deletes again before it
 * exits. It touches no pre-existing record.
 *
 * OWNED BY: APEX Business Systems Ltd.
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
// Prefer the dedicated validation variables; fall back to the environment's
// E2E account when the owner has supplied only that.
const USER_EMAIL = process.env.APEX_TEST_USER_EMAIL || process.env.E2E_USER;
const USER_PASSWORD = process.env.APEX_TEST_USER_PASSWORD || process.env.E2E_PASSWORD;

const TABLE = 'omnilink_links';

const runId =
  process.env.APEX_VALIDATION_RUN_ID ||
  new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outDir = path.resolve('artifacts/production-validation', runId, 'backend-layer');
fs.mkdirSync(outDir, { recursive: true });

/** Stable, non-reversible handle for a user id so evidence correlates without PII. */
const handle = (value) =>
  crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 12);

/** Read a JWT's role claim. Returns the role name only, never the token. */
function jwtRole(token) {
  const parts = String(token).split('.');
  if (parts.length !== 3) return null;
  try {
    const claims = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
    );
    return typeof claims.role === 'string' ? claims.role : null;
  } catch {
    return null;
  }
}

/** Error text with anything credential-shaped stripped. */
const safeError = (error) =>
  error
    ? String(error.message ?? error)
        .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[redacted-jwt]')
        .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[redacted-email]')
        .slice(0, 300)
    : null;

const missing = [];
if (!SUPABASE_URL) missing.push('SUPABASE_URL');
if (!SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY');
if (!USER_EMAIL) missing.push('APEX_TEST_USER_EMAIL (or E2E_USER)');
if (!USER_PASSWORD) missing.push('APEX_TEST_USER_PASSWORD (or E2E_PASSWORD)');

const record = {
  generatedAt: new Date().toISOString(),
  runId,
  layer: 'backend',
  liveProductionTouched: true,
  certifies: false,
  supabaseProjectHost: SUPABASE_URL ? new URL(SUPABASE_URL).hostname : null,
  probes: {},
  limitations: [
    'Data layer only: proves nothing about the deployed web application, protected-route rendering, or UI sign-out.',
    'Single tenant available: cannot prove cross-tenant isolation, which is what SUPABASE_RLS_MULTI_TENANT requires.',
  ],
};

const fresh = () =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

async function main() {
  if (missing.length > 0) {
    record.outcome = 'REQUIRES_MANUAL_VALIDATION';
    record.blocker = `Missing required variables: ${missing.join(', ')}.`;
    return;
  }

  // ── Probe 1: email/password auth issues a real session ────────
  const client = fresh();
  const signIn = await client.auth.signInWithPassword({
    email: USER_EMAIL,
    password: USER_PASSWORD,
  });
  const session = signIn.data?.session ?? null;
  record.probes.auth = {
    question: 'Does email/password auth issue a real session against the live project?',
    signedIn: Boolean(session),
    error: safeError(signIn.error),
    userHandle: session?.user?.id ? handle(session.user.id) : null,
    accessTokenRoleClaim: session?.access_token ? jwtRole(session.access_token) : null,
    refreshTokenPresent: Boolean(session?.refresh_token),
    // The client must never hold a service-role credential.
    roleIsNotServiceRole: session?.access_token
      ? jwtRole(session.access_token) !== 'service_role'
      : null,
  };
  if (!session) {
    record.outcome = 'FAILED';
    record.blocker = `Authentication against the live project failed: ${
      safeError(signIn.error) ?? 'no session returned'
    }`;
    return;
  }

  // ── Probe 2: anonymous client is denied by RLS ────────────────
  const anon = fresh();
  const anonRead = await anon.from(TABLE).select('id').limit(5);
  record.probes.anonymousRls = {
    question: `Can an unauthenticated client read ${TABLE}?`,
    rowsReturned: anonRead.data?.length ?? 0,
    error: safeError(anonRead.error),
    denied: Boolean(anonRead.error) || (anonRead.data?.length ?? 0) === 0,
    // An empty set from an anon client is denial-shaped but not proof of a
    // policy; an explicit error is the stronger signal. Recorded, not inferred.
    signalStrength: anonRead.error ? 'explicit-denial' : 'empty-set-ambiguous',
  };

  // ── Probe 3: authenticated write persists and reads back ──────
  const marker = `prod-validation-backend-${Date.now().toString(36)}`;
  const testUrl = `https://validation.apex-omnihub.invalid/${marker}`;
  const insert = await client
    .from(TABLE)
    .insert({ user_id: session.user.id, url: testUrl, status: 'active' })
    .select('id')
    .single();

  let readBackRows = 0;
  let readBackError = null;
  let cleanupOk = null;
  if (!insert.error) {
    // Read back through a BRAND NEW client with its own connection and its own
    // sign-in, so nothing can be served from the writing client's state.
    const reader = fresh();
    const readerAuth = await reader.auth.signInWithPassword({
      email: USER_EMAIL,
      password: USER_PASSWORD,
    });
    if (readerAuth.data?.session) {
      const readBack = await reader.from(TABLE).select('id,url').eq('url', testUrl);
      readBackRows = readBack.data?.length ?? 0;
      readBackError = safeError(readBack.error);
    } else {
      readBackError = 'reader client could not authenticate';
    }
    // Remove the row this run created. Nothing pre-existing is touched.
    const cleanup = await client.from(TABLE).delete().eq('id', insert.data.id);
    cleanupOk = !cleanup.error;
  }

  record.probes.persistence = {
    question: 'Is an authenticated write durably persisted and readable from a new connection?',
    marker,
    inserted: !insert.error,
    insertError: safeError(insert.error),
    readBackRowsFromNewClient: readBackRows,
    readBackError,
    persisted: !insert.error && readBackRows === 1,
    testRowDeletedAfterProbe: cleanupOk,
  };

  // ── Probe 4: sign-out actually revokes the refresh token ──────
  const staleRefreshToken = session.refresh_token;
  await client.auth.signOut();
  const revoked = fresh();
  const refreshAttempt = await revoked.auth.refreshSession({ refresh_token: staleRefreshToken });
  record.probes.sessionTermination = {
    question: 'Does sign-out revoke the refresh token server-side, or only clear local state?',
    refreshAfterSignOutSucceeded: Boolean(refreshAttempt.data?.session),
    error: safeError(refreshAttempt.error),
    serverSideRevocationProven: !refreshAttempt.data?.session,
  };

  const p = record.probes;
  record.outcome =
    p.auth.signedIn &&
    p.auth.roleIsNotServiceRole &&
    p.persistence.persisted &&
    p.sessionTermination.serverSideRevocationProven
      ? 'BACKEND_BEHAVIOUR_CONFIRMED'
      : 'PARTIAL';
  record.blocker =
    'Corroborating evidence only. AUTH_EMAIL_PASSWORD and OMNIDASH_LIVE_PERSISTENCE certify through the ' +
    'browser specs (application behaviour), and SUPABASE_RLS_MULTI_TENANT needs a second tenant.';
}

await main().catch((error) => {
  record.outcome = 'FAILED';
  record.blocker = `Probe crashed: ${safeError(error)}`;
});

const file = path.join(outDir, 'backend-layer-evidence.json');
fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`);
console.log(`backend-layer evidence written: ${file}`);
console.log(`  outcome: ${record.outcome}`);
for (const [name, probe] of Object.entries(record.probes)) {
  console.log(`  ${name}: ${JSON.stringify(probe).slice(0, 200)}`);
}
