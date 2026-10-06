// @vitest-environment node
import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Behavior tests for the physiomni-ingest handler (function is not deployed): the real
// handler runs against stubbed platform modules.
const h = vi.hoisted(() => {
  const state = {
    calls: [] as Array<{ table: string; op: string; row?: unknown }>,
    device: null as { id: string } | null,
    deviceError: null as { message: string } | null,
    ipAllowed: true,
    deviceLimitAllowed: true,
    rateKeys: [] as string[],
    handler: null as null | ((req: Request) => Promise<Response>),
  };
  const makeClient = () => ({
    from(table: string) {
      const b: Record<string, unknown> = {};
      b.select = () => b;
      b.eq = () => b;
      b.upsert = (row: unknown) => {
        state.calls.push({ table, op: 'upsert', row });
        return b;
      };
      b.update = (row: unknown) => {
        state.calls.push({ table, op: 'update', row });
        return b;
      };
      b.maybeSingle = async () => {
        state.calls.push({ table, op: 'lookup' });
        return { data: state.device, error: state.deviceError };
      };
      b.then = (resolveFn: (v: { error: null }) => unknown) => resolveFn({ error: null });
      return b;
    },
  });
  return { state, makeClient };
});

vi.mock('https://deno.land/std@0.177.0/http/server.ts', () => ({
  serve: (fn: (req: Request) => Promise<Response>) => {
    h.state.handler = fn;
  },
}));
vi.mock('https://deno.land/x/zod@v3.21.4/mod.ts', async () => await import('zod'));
vi.mock('../../supabase/functions/_shared/cors.ts', () => ({
  buildCorsHeaders: () => ({}),
  handlePreflight: () => new Response(null, { status: 204 }),
}));
vi.mock('../../supabase/functions/_shared/rate-limit.ts', () => ({
  RATE_LIMIT_CONFIGS: { physiomniIngest: { maxRequests: 120, windowMs: 60000, keyPrefix: 'physiomni-ingest' } },
  checkRateLimit: vi.fn(async (key: string) => {
    h.state.rateKeys.push(key);
    return { allowed: key.startsWith('ip:') ? h.state.ipAllowed : h.state.deviceLimitAllowed };
  }),
  rateLimitExceededResponse: () => new Response('{}', { status: 429 }),
}));
vi.mock('../../supabase/functions/_shared/supabaseClient.ts', () => ({
  createServiceClient: () => h.makeClient(),
}));

const HANDLER_PATH = '../../supabase/functions/physiomni-ingest/index.ts';

const env: Record<string, string | undefined> = {};
const SIGNING_KEY = 'test-signing-key-material';
const TENANT = '11111111-1111-4111-8111-111111111111';
const DEVICE = 'dev-001';
const NONCE = 'n'.repeat(20);

function call(opts: { key?: string; ts?: string; device?: string; sign?: string; raw?: string } = {}): Promise<Response> {
  const ts = opts.ts ?? new Date().toISOString();
  const device = opts.device ?? DEVICE;
  const sig =
    opts.sign ?? createHmac('sha256', opts.key ?? SIGNING_KEY).update(`${DEVICE}:${TENANT}:${ts}:${NONCE}`).digest('hex');
  const raw =
    opts.raw ??
    JSON.stringify({
      device_id: device,
      tenant_id: TENANT,
      timestamp: ts,
      nonce: NONCE,
      signature: sig,
      payload: { vibration_x: 1, vibration_y: 1, vibration_z: 1, temp_c: 20 },
    });
  const req = new Request('https://example.test/functions/v1/physiomni-ingest', {
    method: 'POST',
    body: raw,
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.9' },
  });
  return (h.state.handler as (r: Request) => Promise<Response>)(req);
}

beforeEach(async () => {
  h.state.calls = [];
  h.state.device = { id: 'device-1' };
  h.state.deviceError = null;
  h.state.ipAllowed = true;
  h.state.deviceLimitAllowed = true;
  h.state.rateKeys = [];
  h.state.handler = null;
  for (const key of Object.keys(env)) delete env[key];
  env.PHYSIOMNI_LIVE_ENABLED = 'true';
  env.PHYSIOMNI_INGRESS_HMAC_SECRET = SIGNING_KEY;

  vi.resetModules();
  (globalThis as unknown as { Deno: unknown }).Deno = { env: { get: (k: string) => env[k] } };
  // Computed specifier: keeps Deno-only handler code out of the repo's tsc program.
  await import(/* @vite-ignore */ HANDLER_PATH);
});

describe('physiomni-ingest authentication', () => {
  it('stays closed outside live mode', async () => {
    delete env.PHYSIOMNI_LIVE_ENABLED;
    expect((await call()).status).toBe(403);
    expect(h.state.calls).toEqual([]);
  });

  it('fails closed when no signing key is configured, and honors only the reconciled name', async () => {
    delete env.PHYSIOMNI_INGRESS_HMAC_SECRET;
    env.PHYSIOMNI_DEVICE_HMAC_SECRET = SIGNING_KEY;
    expect((await call()).status).toBe(503);
    expect(h.state.calls).toEqual([]);
  });

  it('rejects wrong keys, tampered identifiers and out-of-window timestamps before any database access', async () => {
    expect((await call({ key: 'wrong-signing-key-material' })).status).toBe(403);
    expect((await call({ device: 'dev-002' })).status).toBe(403);
    const past = new Date(Date.now() - 5 * 60_000).toISOString();
    const future = new Date(Date.now() + 5 * 60_000).toISOString();
    expect((await call({ ts: past })).status).toBe(403);
    expect((await call({ ts: future })).status).toBe(403);
    expect(h.state.calls).toEqual([]);
  });

  it('rejects malformed JSON and oversized bodies', async () => {
    expect((await call({ raw: '{not json' })).status).toBe(400);
    expect((await call({ raw: JSON.stringify({ pad: 'x'.repeat(5000) }) })).status).toBe(413);
    expect(h.state.calls).toEqual([]);
  });
});

describe('physiomni-ingest registry and limits', () => {
  it('rejects a pair that is not a registered, active device', async () => {
    h.state.device = null;
    expect((await call()).status).toBe(403);
    expect(h.state.calls.some((c) => c.op === 'upsert')).toBe(false);
  });

  it('fails closed when the registry lookup errors', async () => {
    h.state.deviceError = { message: 'boom' };
    expect((await call()).status).toBe(503);
    expect(h.state.calls.some((c) => c.op === 'upsert')).toBe(false);
  });

  it('limits per client IP before parsing, and per verified device after authentication', async () => {
    h.state.ipAllowed = false;
    expect((await call()).status).toBe(429);
    expect(h.state.rateKeys).toEqual(['ip:203.0.113.9']);

    h.state.ipAllowed = true;
    h.state.rateKeys = [];
    h.state.deviceLimitAllowed = false;
    expect((await call()).status).toBe(429);
    expect(h.state.rateKeys).toEqual(['ip:203.0.113.9', `${TENANT}:${DEVICE}`]);
    expect(h.state.calls.some((c) => c.op === 'upsert')).toBe(false);
  });

  it('persists telemetry for a signed reading from a registered device', async () => {
    const res = await call();
    expect(res.status).toBe(200);
    const upsert = h.state.calls.find((c) => c.table === 'physiomni_telemetry' && c.op === 'upsert');
    expect(upsert?.row).toMatchObject({ tenant_id: TENANT, device_serial: DEVICE });
  });
});
