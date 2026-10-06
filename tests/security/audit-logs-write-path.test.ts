import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(path, 'utf8');
/** SQL with `--` comment lines and trailing comments removed. */
const sqlCode = (path: string) =>
  read(path)
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .map((line) => line.replace(/\s+--\s.*$/, ''))
    .join('\n');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (name === 'node_modules' || name === 'dist') return [];
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

const MIGRATION_A = 'supabase/migrations/20260929000000_record_client_audit_event.sql';
const ROLLBACK_A = 'supabase/migrations/rollback/20260929000000_record_client_audit_event_rollback.sql';

describe('audit_logs write path (AUD-1a): migration A is additive', () => {
  const migration = read(MIGRATION_A);
  const code = sqlCode(MIGRATION_A);

  it('adds the writer as a hardened security-definer function', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.record_client_audit_event(');
    expect(migration).toContain('SECURITY DEFINER');
    expect(migration).toContain("SET search_path = ''");
    // The actor is the session user; the caller supplies no actor or timestamp.
    expect(migration).toContain('v_uid uuid := auth.uid()');
    expect(migration).not.toMatch(/p_actor|p_created_at|p_timestamp/);
    expect(migration).toContain("'source', 'client'");
    expect(migration).toContain('pg_advisory_xact_lock');
    expect(migration).toContain('ON CONFLICT (id) DO NOTHING');
  });

  it('allow-lists the browser action types and nothing else', () => {
    const listed = migration.match(/NOT IN \(([\s\S]*?)\)\s*THEN/);
    expect(listed).not.toBeNull();
    const types = [...listed![1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(types).toEqual([
      'login',
      'logout',
      'omnidash.settings.updated',
      'omnilink.port.request',
      'omnilink.port.failure',
      'omnilink.port.disabled',
    ]);
    // Server-authored types stay server-only.
    expect(types).not.toContain('mcp_tool_call');
    expect(types).not.toContain('oauth_exchange');
  });

  it('grants execute to signed-in users only', () => {
    expect(code).toMatch(
      /REVOKE ALL ON FUNCTION public\.record_client_audit_event\([^)]*\) FROM PUBLIC, anon;/,
    );
    expect(code).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.record_client_audit_event\([^)]*\) TO authenticated;/,
    );
  });

  it('changes no table, privilege on a table, or policy (nothing breaks before the switch)', () => {
    expect(code).not.toMatch(/\bDROP\s+POLICY\b/i);
    expect(code).not.toMatch(/\bCREATE\s+POLICY\b/i);
    expect(code).not.toMatch(/\bALTER\s+TABLE\b/i);
    expect(code).not.toMatch(/\b(REVOKE|GRANT)\b[^;]*\bON\s+(TABLE\s+)?(public\.)?audit_logs\b/i);
    // The only REVOKE is on the new function itself.
    const revokes = code.match(/\bREVOKE\b[^;]*;/g) ?? [];
    expect(revokes).toHaveLength(1);
    expect(revokes[0]).toContain('ON FUNCTION public.record_client_audit_event(');
  });

  it('ships a rollback that only removes the function', () => {
    const rollback = sqlCode(ROLLBACK_A);
    expect(rollback.trim()).toBe(
      'DROP FUNCTION IF EXISTS public.record_client_audit_event(uuid, text, text, text, jsonb);',
    );
  });
});

describe('audit_logs write path (AUD-1a): server paths', () => {
  it('writes the apex-agent oauth_exchange audit row with the service client', () => {
    const source = read('supabase/functions/apex-agent/index.ts');
    expect(source).toContain('createServiceClient().from("audit_logs").insert({');
    expect(source).not.toMatch(/supabase\.from\("audit_logs"\)\.insert/);
    // The verified user is still the recorded actor.
    expect(source).toMatch(/actor_id: user\.id,\s*\n\s*action_type: "oauth_exchange"/);
  });
});

const MIGRATION_B = 'supabase/migrations/20260929000100_audit_logs_revoke_client_insert.sql';
const ROLLBACK_B = 'supabase/migrations/rollback/20260929000100_audit_logs_revoke_client_insert_rollback.sql';

describe('audit_logs write path (AUD-1b): migration B revokes client INSERT', () => {
  const migration = read(MIGRATION_B);
  const code = sqlCode(MIGRATION_B);

  it('removes direct INSERT for client roles and keeps the service role path', () => {
    expect(code).toContain('DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_logs;');
    expect(code).toContain('REVOKE INSERT ON public.audit_logs FROM authenticated, anon;');
    expect(migration).not.toContain('Service role can insert audit logs');
    expect(code).not.toMatch(/\bDROP\s+FUNCTION\b/i);
  });

  it('refuses to run before migration A, and sorts after it', () => {
    expect(code).toMatch(/to_regprocedure\('public\.record_client_audit_event\(uuid,text,text,text,jsonb\)'\) IS NULL/);
    expect(code).toContain('RAISE EXCEPTION');
    const order = [MIGRATION_A, MIGRATION_B].map((f) => f.split('/').pop()!);
    expect([...order].sort()).toEqual(order);
    // The guard runs before the policy drop and the revoke.
    expect(code.indexOf('to_regprocedure')).toBeLessThan(code.indexOf('DROP POLICY'));
    expect(code.indexOf('DROP POLICY')).toBeLessThan(code.indexOf('REVOKE INSERT'));
  });

  it('ships a rollback that restores the original policy and privilege', () => {
    const rollback = read(ROLLBACK_B);
    expect(rollback).toContain('GRANT INSERT ON public.audit_logs TO authenticated, anon;');
    expect(rollback).toContain('DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_logs;');
    expect(rollback).toContain('WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);');
    expect(sqlCode(ROLLBACK_B)).not.toMatch(/record_client_audit_event/);
  });
});

describe('audit_logs write path (AUD-1b): no client-side table writes', () => {
  it('has no browser code that writes audit_logs directly', () => {
    const offenders = ['src', 'apps/omnihub-site/src', 'apps/omnihub-site/dashboard']
      .flatMap(sourceFiles)
      .filter((file) =>
        /from\(\s*['"]audit_logs['"]\s*\)\s*\.\s*(insert|upsert|update|delete)\b/.test(read(file)),
      );
    expect(offenders).toEqual([]);
  });
});

describe('browser audit writer calls the server function', () => {
  const rpc = vi.fn();
  const store = new Map<string, unknown>();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
    rpc.mockReset();
    store.clear();
    vi.doMock('@/lib/monitoring', () => ({ logAnalyticsEvent: vi.fn(), logError: vi.fn() }));
    vi.doMock('@/libs/persistence', () => ({
      persistentGet: async (key: string) => store.get(key),
      persistentSet: async (key: string, value: unknown) => void store.set(key, value),
    }));
    vi.doMock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  const load = async () => await import('../../src/security/auditLog');
  // recordAuditEvent queues in the background and schedules the flush on a timer.
  const settle = async () => {
    await vi.advanceTimersByTimeAsync(1);
    await vi.advanceTimersByTimeAsync(1);
  };

  it('sends only event fields and drains the queue on success', async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    const { recordAuditEvent, flushQueue, getAuditQueueSnapshot } = await load();

    const entry = recordAuditEvent({
      actorId: 'someone-else',
      actionType: 'logout',
      resourceType: 'session',
      resourceId: 'self',
    });
    await settle();
    await flushQueue(true);

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('record_client_audit_event', {
      p_id: entry.id,
      p_action_type: 'logout',
      p_resource_type: 'session',
      p_resource_id: 'self',
      p_metadata: null,
    });
    expect(await getAuditQueueSnapshot()).toHaveLength(0);
  });

  it('treats a throttled event (false) as final and does not retry it', async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    const { recordAuditEvent, flushQueue, getAuditQueueSnapshot } = await load();

    recordAuditEvent({ actionType: 'omnilink.port.request', resourceType: 'omnilink' });
    await settle();
    await flushQueue(true);

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(await getAuditQueueSnapshot()).toHaveLength(0);
  });

  it('keeps the event queued for retry when the server call fails', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const { recordAuditEvent, getAuditQueueSnapshot } = await load();

    recordAuditEvent({ actionType: 'login', resourceType: 'session' });
    await settle();

    const queue = await getAuditQueueSnapshot();
    expect(queue).toHaveLength(1);
    expect(queue[0].attempts).toBe(1);
    expect(queue[0].status).toBe('pending');
  });
});
