import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// APEX-REV-2026-09 WP-05 (F-08): the deployed root migration chain must own
// public.access_requests, idempotently, without touching existing lead rows.
const MIGRATION = resolve(process.cwd(), 'supabase/migrations/20260928000000_access_requests_canonical.sql');
const ROLLBACK = resolve(
  process.cwd(),
  'supabase/migrations/rollback/20260928000000_access_requests_canonical_rollback.sql'
);

/** SQL with `--` line comments removed, so assertions only see executable statements. */
function executableSql(path: string): string {
  return readFileSync(path, 'utf8')
    .split('\n')
    .map((line) => line.replace(/--.*$/, ''))
    .join('\n');
}

describe('access_requests canonical root migration', () => {
  it('exists in the deployed root migration chain with a rollback script', () => {
    expect(existsSync(MIGRATION)).toBe(true);
    expect(existsSync(ROLLBACK)).toBe(true);
  });

  const sql = existsSync(MIGRATION) ? executableSql(MIGRATION) : '';

  it('creates the table idempotently with the unique email key', () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.access_requests/);
    expect(sql).toMatch(/CONSTRAINT access_requests_email_key UNIQUE \(email\)/);
    expect(sql).toMatch(/ALTER TABLE public\.access_requests ENABLE ROW LEVEL SECURITY/);
  });

  it('guards every CREATE INDEX with IF NOT EXISTS', () => {
    const indexes = sql.match(/CREATE INDEX[^;]*/g) ?? [];
    expect(indexes.length).toBeGreaterThan(0);
    for (const stmt of indexes) expect(stmt).toMatch(/^CREATE INDEX IF NOT EXISTS/);
  });

  it('drops each policy before re-creating it', () => {
    const created = [...sql.matchAll(/CREATE POLICY "([^"]+)"/g)].map((m) => m[1]);
    expect(created).toEqual([
      'Allow anonymous inserts',
      'Deny anonymous reads',
      'Deny anonymous updates',
      'Deny anonymous deletes',
    ]);
    for (const name of created) {
      const drop = sql.indexOf(`DROP POLICY IF EXISTS "${name}" ON public.access_requests`);
      expect(drop).toBeGreaterThan(-1);
      expect(drop).toBeLessThan(sql.indexOf(`CREATE POLICY "${name}"`));
    }
  });

  it('keeps anon insert-only: INSERT allowed, SELECT/UPDATE/DELETE denied', () => {
    expect(sql).toMatch(/"Allow anonymous inserts"\s+ON public\.access_requests\s+FOR INSERT\s+TO anon\s+WITH CHECK \(true\)/);
    for (const cmd of ['SELECT', 'UPDATE', 'DELETE']) {
      expect(sql).toMatch(new RegExp(`FOR ${cmd}\\s+TO anon\\s+USING \\(false\\)`));
    }
  });

  it('re-creates the trigger idempotently with a pinned search_path function', () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.update_access_requests_updated_at\(\)/);
    expect(sql).toMatch(/SET search_path = ''/);
    const drop = sql.indexOf('DROP TRIGGER IF EXISTS access_requests_updated_at_trigger ON public.access_requests');
    expect(drop).toBeGreaterThan(-1);
    expect(drop).toBeLessThan(sql.indexOf('CREATE TRIGGER access_requests_updated_at_trigger'));
  });

  it('never modifies or deletes existing rows (contract N5)', () => {
    expect(sql).not.toMatch(/\b(UPDATE|DELETE FROM|TRUNCATE)\s+public\.access_requests\b/i);
    expect(sql).not.toMatch(/DROP TABLE/i);
  });

  it('rollback never drops the lead table in executable SQL', () => {
    const rollback = existsSync(ROLLBACK) ? executableSql(ROLLBACK) : '';
    expect(rollback).not.toMatch(/DROP TABLE/i);
    expect(rollback).toMatch(/CREATE OR REPLACE FUNCTION public\.update_access_requests_updated_at\(\)/);
  });
});
