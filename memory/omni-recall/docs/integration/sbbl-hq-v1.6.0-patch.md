---
version: 1.0.0
last_audited: 2026-06-12
status: verified
---

# SBBL-HQ Integration Patch — v1.6.0 Bidirectional Wiring

> **Current-state note (2026-09-29):** these `npm run` names in this document are not defined in any `package.json` in the repository and should be treated as planned or historical, not runnable: `cf:deploy`. The runnable scripts are in the root `package.json`.

## Vercel Reference Classification

LEGACY — retained for historical/reference use; Cloudflare-first topology is canonical. Any Vercel commands, rollback paths, modules, or Edge Runtime references in this document are not current deployment proof unless separately labeled VERIFIED with active configuration evidence. See `docs/architecture/CANONICAL_TRUTH_MATRIX.md`.


**Target repo:** `apexbusiness-systems/sbbl-hq`
**Counterpart:** APEX-OmniHub v1.6.0 (this repo)
**Audience:** SBBL-HQ maintainer / release engineer
**Apply from:** a session authorized for `apexbusiness-systems/sbbl-hq`

This document contains the code changes that must land in SBBL-HQ to
complete the bidirectional integration. OmniHub v1.6.0 is already wired
and tested (see `tests/api/omnibridge-roundtrip.test.ts`).

Cryptographic contract compatibility is **byte-verified**: SBBL-HQ's
`src/lib/sync-packets.ts::signSyncPacket` produces signatures that
OmniHub's `/api/omnibridge/sync` verifier accepts without modification.
OmniHub signs outbound commands using the same primitive, so an
SBBL-HQ-side verifier reusing the existing `crypto.subtle.verify`
pattern will accept those too.

---

## Part A — OUTBOUND from SBBL-HQ to OmniHub (already 95% scaffolded on your side)

Your repo already has:
- `src/lib/sync-packets.ts::signSyncPacket` (correct algorithm)
- `src/worker/bindings.d.ts` declarations for `OMNIHUB_SYNC_URL`, `OMNIHUB_SIGNING_SECRET`
- `src/worker/index.ts` imports `signSyncPacket` (but doesn't call it yet)

You need to add the **outbound emit callsite** at each canonical state
transition. Example:

```typescript
// src/worker/lib/omnihub-emit.ts  (NEW FILE)
import { signSyncPacket, type SyncPacket } from '@/lib/sync-packets';

export async function emitToOmniHub(env: Env, packet: Omit<SyncPacket, 'packet_id' | 'emitted_at'>): Promise<void> {
  if (!env.OMNIHUB_SYNC_URL || !env.OMNIHUB_SIGNING_SECRET) {
    // Feature-flagged off. Do nothing.
    return;
  }
  const fullPacket: SyncPacket = {
    ...packet,
    packet_id: crypto.randomUUID(),
    emitted_at: new Date().toISOString(),
  };
  const envelope = await signSyncPacket(fullPacket, env.OMNIHUB_SIGNING_SECRET);

  try {
    const res = await fetch(env.OMNIHUB_SYNC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Omni-Source': 'sbbl-hq',
      },
      body: JSON.stringify(envelope),
      signal: AbortSignal.timeout(3_000),
    });
    if (!res.ok) {
      console.warn(`[omnihub-emit] non-ok response: ${res.status}`);
    }
  } catch (e) {
    // Fire-and-forget. Emission failure should NOT fail the primary flow.
    console.warn(`[omnihub-emit] emit failed:`, e);
  }
}
```

Then call it at each league state transition, e.g. where games are
finalized, rosters mutate, or streams start. Wrap in `ctx.waitUntil(...)`
so it doesn't block the user response:

```typescript
// Example — inside your existing game-finalize handler
ctx.waitUntil(emitToOmniHub(env, {
  trace_id: crypto.randomUUID(),
  event_type: 'game.finalized',
  entity_type: 'game',
  entity_id: gameId,
  league_id: leagueId,
  payload: { final_home: 89, final_away: 76, winner_id: winnerId },
}));
```

---

## Part B — INBOUND from OmniHub to SBBL-HQ (new code required)

OmniHub needs to be able to issue control-plane commands (disable streams,
revoke access, emergency halts, hotfix dispatch). Add a new route.

**New file: `src/worker/routes/omnihub.ts`**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';

type Env = {
  OMNIHUB_VERIFY_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_URL: string;
};

interface OmniHubCommand {
  command_id: string;
  action:
    | 'disable_stream' | 'enable_stream'
    | 'revoke_access' | 'grant_access'
    | 'emergency_halt' | 'broadcast_message'
    | 'force_man_review' | 'hotfix_dispatch';
  target_source: string;
  target_entity_id: string | null;
  reason: string;
  issued_at: string;
  issued_by: string;
  target_file_allowlist?: string[];
  payload: Record<string, unknown>;
}

interface OmniHubEnvelope {
  command: OmniHubCommand;
  signature: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function base64UrlToBytes(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  const pad = (4 - (value.length % 4)) % 4;
  const s = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad);
  try {
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch { return null; }
}

export async function handleOmniHubWebhook(req: Request, env: Env, admin: SupabaseClient): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!env.OMNIHUB_VERIFY_KEY) return json({ error: 'not_configured' }, 501);

  let body: OmniHubEnvelope;
  try {
    body = await req.json() as OmniHubEnvelope;
  } catch { return json({ error: 'invalid_json' }, 400); }
  if (!body || typeof body !== 'object' || !body.command || !body.signature) {
    return json({ error: 'invalid_envelope' }, 400);
  }

  // Verify HMAC-SHA256 over JSON.stringify(command) with base64url signature.
  // SYMMETRICAL to our own signSyncPacket algorithm.
  const sigBytes = base64UrlToBytes(body.signature);
  if (!sigBytes) return json({ error: 'bad_signature' }, 401);
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(env.OMNIHUB_VERIFY_KEY),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'],
  );
  const ok = await crypto.subtle.verify(
    'HMAC', key, sigBytes,
    new TextEncoder().encode(JSON.stringify(body.command)),
  );
  if (!ok) return json({ error: 'bad_signature' }, 401);

  // Timestamp freshness (reject commands older than 5 minutes)
  const issuedMs = Date.parse(body.command.issued_at);
  if (Number.isNaN(issuedMs) || Math.abs(Date.now() - issuedMs) > 300_000) {
    return json({ error: 'stale_command' }, 400);
  }

  // Idempotency / audit — insert to omnihub_command_log (create this table)
  const { error: logErr } = await admin.from('omnihub_command_log').insert({
    command_id: body.command.command_id,
    action: body.command.action,
    payload: body.command.payload,
    issued_at: body.command.issued_at,
    issued_by: body.command.issued_by,
  });
  if (logErr && !logErr.message.includes('duplicate')) {
    return json({ error: 'audit_insert_failed', detail: logErr.message }, 500);
  }

  // Execute the command (implement each action):
  switch (body.command.action) {
    case 'broadcast_message':
      // e.g. insert into broadcasts table
      return json({ acknowledged: true, command_id: body.command.command_id });
    case 'disable_stream':
      // e.g. UPDATE games SET streaming_disabled=true WHERE id=target_entity_id
      return json({ acknowledged: true, command_id: body.command.command_id });
    case 'emergency_halt':
      // e.g. toggle a kill switch in a CF Durable Object or env var
      return json({ acknowledged: true, command_id: body.command.command_id });
    case 'hotfix_dispatch':
      // HIGHEST-RISK action. Must be implemented with:
      //   (1) Explicit allowlist check against target_file_allowlist
      //   (2) Dispatch to a constrained agent runtime (NOT your main worker)
      //   (3) Git-based rollback capability
      //   (4) Signed patch diff return
      // Recommend: defer to v1.6.1 unless you have a hardened agent runtime.
      return json({ error: 'hotfix_not_implemented_yet' }, 501);
    default:
      return json({ error: 'unknown_action', action: body.command.action }, 400);
  }
}
```

**Edit `src/worker/validation-contract-wrapper.ts` or `src/worker/index.ts`** to register the route:

```typescript
import { handleOmniHubWebhook } from './routes/omnihub';

// In your router:
if (url.pathname === '/webhooks/omnihub') {
  return handleOmniHubWebhook(req, env, getAdminClient(env));
}
```

**New Supabase migration on SBBL-HQ side:**

```sql
CREATE TABLE IF NOT EXISTS omnihub_command_log (
  command_id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  payload JSONB NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL,
  issued_by TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ
);
ALTER TABLE omnihub_command_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON omnihub_command_log FOR ALL TO service_role USING (TRUE);
```

---

## Part C — Secrets to set on SBBL-HQ Cloudflare Workers

Both secrets are generated on the OmniHub side. Set them on SBBL-HQ as:

```bash
# From the sbbl-hq repo root:
npx wrangler secret put OMNIHUB_SIGNING_SECRET
# Paste: <OMNIBRIDGE_SBBL_NATIVE_SECRET from OmniHub>

npx wrangler secret put OMNIHUB_VERIFY_KEY
# Paste: <CONTROL_SIGNING_SECRET_SBBL_HQ from OmniHub>
```

And set the outbound target URL as a var in `wrangler.jsonc`:

```jsonc
"vars": {
  ...,
  "OMNIHUB_SYNC_URL": "https://apexomnihub.icu/api/omnibridge/sync"
}
```

Or preferably as a secret if the URL is sensitive:

```bash
npx wrangler secret put OMNIHUB_SYNC_URL
```

---

## Part D — Deployment order (critical for live event)

1. Apply OmniHub v1.6.0 Supabase migration (this repo's
   `supabase/migrations/20260417000000_omnibridge_events.sql`).
2. Set OmniHub env secrets (see `.env.example` additions in this repo).
3. Deploy OmniHub (Vercel). Confirm `/api/omnibridge/sync` returns 401 for
   unsigned requests and 202 for validly signed ones.
4. Apply SBBL-HQ migration from Part B.
5. Set SBBL-HQ wrangler secrets from Part C.
6. Deploy SBBL-HQ (`npm run cf:deploy`).
7. Smoke test by emitting a test packet from SBBL-HQ and watching the
   OmniHub live feed (Realtime subscription to `omnibridge_events`).

---

## Part E — Rollback

Every change is additive and gated behind env var presence:

- SBBL-HQ outbound: if `OMNIHUB_SYNC_URL` is unset, `emitToOmniHub` is a no-op.
- SBBL-HQ inbound: if `OMNIHUB_VERIFY_KEY` is unset, route returns 501.
- OmniHub sync endpoint: rejects all traffic unless registry lists the source.
- OmniHub control plane: requires auth + admin role + two-party MAN approval for RED actions.

To disable entirely:
1. Unset env vars on both sides.
2. SBBL-HQ: deploy a revert of Part A and B.
3. OmniHub: no rollback required on the receive path (it just stops receiving).

---

## Appendix — Evidence of cryptographic compatibility

See `tests/api/omnibridge-roundtrip.test.ts` in this repo. The test
`produces byte-identical signatures to SBBL-HQ native signSyncPacket`
recreates SBBL-HQ's exact signing algorithm and asserts bit-for-bit
equality with OmniHub's `signSyncPacketForTest`. The test
`OmniHub verifier accepts SBBL-HQ native signatures` then takes a
SBBL-HQ-produced signature and feeds it through OmniHub's verifier. Both
pass. This is proof — not assumption — that the contract holds.
