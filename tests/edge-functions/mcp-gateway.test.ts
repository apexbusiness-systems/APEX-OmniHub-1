// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isToolAllowed,
  READ_SCOPES,
  resolveGatewayIdentity,
  TOOL_SCOPES,
  WRITE_SCOPES,
} from '../../supabase/functions/mcp-gateway/scopes';

// MCP-H1: least-privilege scopes, per-call audit and rate limiting for the gateway.
const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');
const req = (headers: Record<string, string> = {}, url = 'https://example.test/mcp-gateway') =>
  new Request(url, { headers });

const KEYS = { writeKey: 'write-key-material-01', readKey: 'read-key-material-02', legacyKey: 'legacy-key-material-3' };

describe('gateway scope model', () => {
  const toolSources = ['db', 'github', 'cloudflare', 'omnihub'].map((g) =>
    read(`supabase/functions/mcp-gateway/tools/${g}.ts`),
  );
  const realTools = toolSources.flatMap((src) => [...src.matchAll(/^\s*name: "([a-z_]+)",/gm)].map((m) => m[1]));

  it('scopes every real tool and nothing else', () => {
    expect(realTools.length).toBe(26);
    expect([...realTools].sort()).toEqual(Object.keys(TOOL_SCOPES).sort());
  });

  it('no longer ships the raw SQL tool', () => {
    expect(realTools).not.toContain('db_execute_sql');
    expect(TOOL_SCOPES).not.toHaveProperty('db_execute_sql');
    expect(read('supabase/functions/mcp-gateway/tools/db.ts')).not.toMatch(/execute_sql/);
  });

  it('classifies every mutating tool as a write scope', () => {
    for (const tool of ['db_insert', 'db_update', 'db_delete', 'db_upsert', 'github_create_branch', 'github_push_files',
      'github_create_pr', 'cf_trigger_deploy', 'cf_purge_cache', 'omnihub_emit_event', 'omnihub_claim_task',
      'omnihub_complete_task', 'omnihub_execute_intent']) {
      expect(TOOL_SCOPES[tool]).toMatch(/:write$/);
    }
  });

  it('gives the write key read and write scopes, and the read and legacy keys read scopes only', async () => {
    const write = await resolveGatewayIdentity(req({ Authorization: `Bearer ${KEYS.writeKey}` }), KEYS);
    const readOnly = await resolveGatewayIdentity(req({ 'x-api-key': KEYS.readKey }), KEYS);
    const legacy = await resolveGatewayIdentity(req({ Authorization: `Bearer ${KEYS.legacyKey}` }), KEYS);
    expect([...(write?.scopes ?? [])].sort()).toEqual([...READ_SCOPES, ...WRITE_SCOPES].sort());
    expect([...(readOnly?.scopes ?? [])].sort()).toEqual([...READ_SCOPES].sort());
    expect([...(legacy?.scopes ?? [])].sort()).toEqual([...READ_SCOPES].sort());
    expect(isToolAllowed(readOnly!, 'db_select')).toBe(true);
    expect(isToolAllowed(readOnly!, 'db_delete')).toBe(false);
    expect(isToolAllowed(legacy!, 'cf_trigger_deploy')).toBe(false);
    expect(isToolAllowed(write!, 'cf_trigger_deploy')).toBe(true);
  });

  it('denies unknown tools and unknown or absent credentials', async () => {
    const write = await resolveGatewayIdentity(req({ Authorization: `Bearer ${KEYS.writeKey}` }), KEYS);
    expect(isToolAllowed(write!, 'not_a_tool')).toBe(false);
    expect(await resolveGatewayIdentity(req({ Authorization: 'Bearer nope' }), KEYS)).toBeNull();
    expect(await resolveGatewayIdentity(req(), KEYS)).toBeNull();
    expect(await resolveGatewayIdentity(req({}, `https://example.test/mcp-gateway?key=${KEYS.writeKey}`), KEYS)).toBeNull();
    expect(await resolveGatewayIdentity(req({ Authorization: `Bearer ${KEYS.writeKey}` }), {})).toBeNull();
  });

  it('identifies keys by a non-secret fingerprint', async () => {
    const id = await resolveGatewayIdentity(req({ Authorization: `Bearer ${KEYS.writeKey}` }), KEYS);
    expect(id?.keyId).toMatch(/^write:[0-9a-f]{12}$/);
    expect(id?.keyId).not.toContain(KEYS.writeKey);
  });
});

// ─── Handler behavior against stubbed platform modules ───────────────────────
const h = vi.hoisted(() => {
  const state = {
    handler: null as null | ((r: Request) => Promise<Response>),
    audits: [] as Array<Record<string, unknown>>,
    auditFails: false,
    dispatched: [] as string[],
    rateKeys: [] as string[],
    ipAllowed: true,
    keyAllowed: true,
  };
  return { state };
});

vi.mock('https://deno.land/std@0.168.0/http/server.ts', () => ({
  serve: (fn: (r: Request) => Promise<Response>) => {
    h.state.handler = fn;
  },
}));
vi.mock('../../supabase/functions/_shared/cors.ts', () => ({ buildCorsHeaders: () => ({}) }));
vi.mock('../../supabase/functions/_shared/requestUtils.ts', () => ({ getClientIp: () => '203.0.113.9' }));
vi.mock('../../supabase/functions/_shared/rate-limit.ts', () => ({
  RATE_LIMIT_CONFIGS: { mcpGateway: { maxRequests: 60, windowMs: 60000, keyPrefix: 'mcp-gateway' } },
  checkRateLimit: vi.fn(async (key: string) => {
    h.state.rateKeys.push(key);
    return { allowed: key.startsWith('ip:') ? h.state.ipAllowed : h.state.keyAllowed };
  }),
  rateLimitExceededResponse: () => new Response('{}', { status: 429 }),
}));
vi.mock('../../supabase/functions/_shared/supabaseClient.ts', () => ({
  createServiceClient: () => ({
    from: () => ({
      insert: async (row: Record<string, unknown>) => {
        if (h.state.auditFails) return { error: { message: 'audit down' } };
        h.state.audits.push(row);
        return { error: null };
      },
    }),
  }),
}));
vi.mock('../../supabase/functions/mcp-gateway/tools/registry.ts', () => {
  const t = (name: string) => ({ name, description: name, inputSchema: { type: 'object', properties: {} } });
  return {
    ALL_TOOLS: ['db_select', 'db_delete', 'github_get_file', 'cf_trigger_deploy', 'omnihub_platform_health'].map(t),
    dispatchTool: async (name: string) => {
      h.state.dispatched.push(name);
      return { content: [{ type: 'text', text: 'done' }] };
    },
  };
});

const HANDLER_PATH = '../../supabase/functions/mcp-gateway/index.ts';
const env: Record<string, string | undefined> = {};

function rpc(key: string | null, body: unknown, headers: Record<string, string> = {}): Promise<Response> {
  const request = new Request('https://example.test/functions/v1/mcp-gateway', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}), ...headers },
  });
  return (h.state.handler as (r: Request) => Promise<Response>)(request);
}
const call = (name: string, args: Record<string, unknown> = {}) => ({
  jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args },
});
const auditStatuses = () => h.state.audits.map((a) => (a.metadata as { status: string }).status);

describe('gateway handler', () => {
  beforeEach(async () => {
    Object.assign(h.state, { audits: [], auditFails: false, dispatched: [], rateKeys: [], ipAllowed: true, keyAllowed: true, handler: null });
    for (const k of Object.keys(env)) delete env[k];
    env.MCP_GATEWAY_WRITE_KEY = KEYS.writeKey;
    env.MCP_GATEWAY_READ_KEY = KEYS.readKey;
    env.MCP_GATEWAY_API_KEY = KEYS.legacyKey;
    vi.resetModules();
    (globalThis as unknown as { Deno: unknown }).Deno = { env: { get: (k: string) => env[k] } };
    // Computed specifier: keeps Deno-only handler code out of the repo's tsc program.
    await import(/* @vite-ignore */ HANDLER_PATH);
  });

  it('rejects unknown keys and answers 401 without touching tools or audit', async () => {
    expect((await rpc('wrong', call('db_select'))).status).toBe(401);
    expect((await rpc(null, call('db_select'))).status).toBe(401);
    expect(h.state.dispatched).toEqual([]);
    expect(h.state.audits).toEqual([]);
  });

  it('lists only the tools the key is scoped for', async () => {
    const list = async (key: string) =>
      ((await (await rpc(key, { jsonrpc: '2.0', id: 1, method: 'tools/list' })).json()) as {
        result: { tools: Array<{ name: string }> };
      }).result.tools.map((t) => t.name).sort();
    expect(await list(KEYS.readKey)).toEqual(['db_select', 'github_get_file', 'omnihub_platform_health']);
    expect(await list(KEYS.legacyKey)).toEqual(['db_select', 'github_get_file', 'omnihub_platform_health']);
    expect((await list(KEYS.writeKey)).length).toBe(5);
  });

  it('refuses write tools for read-scoped keys, audits the denial and never dispatches', async () => {
    const res = await rpc(KEYS.readKey, call('db_delete', { table: 'x' }));
    const body = (await res.json()) as { error: { code: number } };
    expect(body.error.code).toBe(-32001);
    expect(h.state.dispatched).toEqual([]);
    expect(auditStatuses()).toEqual(['denied']);
  });

  it('runs read tools for a read key with one ok audit row', async () => {
    const res = await rpc(KEYS.readKey, call('db_select', { table: 'x' }));
    expect(((await res.json()) as { result: unknown }).result).toBeDefined();
    expect(h.state.dispatched).toEqual(['db_select']);
    expect(auditStatuses()).toEqual(['ok']);
  });

  it('records an attempt before a write and an outcome after, with hashed arguments only', async () => {
    await rpc(KEYS.writeKey, call('cf_trigger_deploy', { b: 2, a: { z: 1, y: 2 } }));
    await rpc(KEYS.writeKey, call('cf_trigger_deploy', { a: { y: 2, z: 1 }, b: 2 }));
    expect(h.state.dispatched).toEqual(['cf_trigger_deploy', 'cf_trigger_deploy']);
    expect(auditStatuses()).toEqual(['attempt', 'ok', 'attempt', 'ok']);
    const meta = h.state.audits.map((a) => a.metadata as Record<string, string>);
    expect(meta[0].args_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(meta[0].args_hash).toBe(meta[2].args_hash);
    expect(meta[0].key_id).toMatch(/^write:[0-9a-f]{12}$/);
    expect(JSON.stringify(h.state.audits)).not.toContain(KEYS.writeKey);
    expect(h.state.audits[0]).toMatchObject({ action_type: 'mcp_tool_call', resource_type: 'mcp_tool', resource_id: 'cf_trigger_deploy' });
  });

  it('refuses write tools when the attempt cannot be recorded', async () => {
    h.state.auditFails = true;
    const body = (await (await rpc(KEYS.writeKey, call('db_delete'))).json()) as { error: { code: number } };
    expect(body.error.code).toBe(-32002);
    expect(h.state.dispatched).toEqual([]);
  });

  it('still serves read tools when the audit store is down (best-effort)', async () => {
    h.state.auditFails = true;
    await rpc(KEYS.readKey, call('db_select'));
    expect(h.state.dispatched).toEqual(['db_select']);
  });

  it('rate limits per client IP before auth and per key after auth', async () => {
    h.state.ipAllowed = false;
    expect((await rpc('wrong', call('db_select'))).status).toBe(429);
    expect(h.state.rateKeys).toEqual(['ip:203.0.113.9']);

    h.state.ipAllowed = true;
    h.state.keyAllowed = false;
    h.state.rateKeys = [];
    expect((await rpc(KEYS.readKey, call('db_select'))).status).toBe(429);
    expect(h.state.rateKeys[0]).toBe('ip:203.0.113.9');
    expect(h.state.rateKeys[1]).toMatch(/^read:[0-9a-f]{12}$/);
    expect(h.state.dispatched).toEqual([]);
  });

  it('caps batch size', async () => {
    const batch = Array.from({ length: 21 }, (_, i) => ({ jsonrpc: '2.0', id: i + 1, method: 'ping' }));
    expect((await rpc(KEYS.readKey, batch)).status).toBe(400);
  });
});
