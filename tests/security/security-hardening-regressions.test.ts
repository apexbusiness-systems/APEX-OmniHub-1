import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

describe('security hardening regressions', () => {
  it('keeps subscription activation RPC service-role only', () => {
    const migration = read('supabase/migrations/20260601000000_harden_subscription_activation_rpc.sql');

    expect(migration).toContain("COALESCE(auth.role(), '') <> 'service_role'");
    expect(migration).toMatch(/REVOKE EXECUTE ON FUNCTION public\.activate_client_subscription\([\s\S]*?FROM authenticated;/);
    expect(migration).toMatch(/GRANT EXECUTE ON FUNCTION public\.activate_client_subscription\([\s\S]*?TO service_role;/);
    expect(migration).toContain('SET search_path = public, pg_temp');
  });

  it('routes activate-client entitlement writes through a server-side service client', () => {
    const source = read('supabase/functions/activate-client/index.ts');

    expect(source).toContain("client.auth.getUser()");
    expect(source).toContain("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')");
    expect(source).toContain("adminClient.rpc('activate_client_subscription'");
    expect(source).toContain("p_user_id: user.id");
    expect(source).toContain("p_tier: 'BASIC'");
    expect(source).not.toContain('message: error instanceof Error ? error.message');
  });

  it('requires real PhysiOmni live telemetry HMAC validation instead of header presence', () => {
    const source = read('supabase/functions/physiomni-ingest/index.ts');

    // Verification is WebCrypto HMAC-SHA256 (constant-time verify), never header presence.
    expect(source).toContain("{ name: 'HMAC', hash: 'SHA-256' }");
    expect(source).toContain("crypto.subtle.verify('HMAC'");
    // Fails closed when no signing key is configured.
    expect(source).toMatch(/if \(!hmacSecret\) \{[\s\S]*?503/);
    // Replay window on the signed timestamp.
    expect(source).toContain('Math.abs(Date.now() - telemetryTime) > REPLAY_WINDOW_MS');
    // Only registered, active devices; rate limit keyed on the verified identity, after that check.
    const registry = source.indexOf(".from('physiomni_devices')");
    const limit = source.indexOf('checkRateLimit(`${tenant_id}:${device_id}`');
    expect(source).toContain(".eq('is_active', true)");
    expect(registry).toBeGreaterThan(-1);
    expect(limit).toBeGreaterThan(registry);
    expect(source).not.toContain('Placeholder for HMAC signed telemetry validation');
    expect(source).not.toContain("!isLiveEnabled || req.headers.get('x-physiomni-signature')");
  });

  it('keeps the retired physiomni-ingress endpoint out of the tree', () => {
    expect(existsSync('supabase/functions/physiomni-ingress')).toBe(false);
    expect(existsSync('.github/workflows/deploy-physiomni-ingress.yml')).toBe(false);
    expect(read('supabase/functions/physiomni-ingest/index.ts')).not.toContain('physiomni-ingress');
  });
});
