import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

// APEX-REV-2026-09 WP-01 (F-01, F-02, F-23): the latest migrations must provision
// BUS as 'business', BASIC as 'free', accept BUS in user_entitlements, and admit
// any signed-in owner on the five OmniDash policies (owner decision D1, option a).
const DIR = resolve(process.cwd(), 'supabase/migrations');
const files = readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();
const sqlOf = (f: string) =>
  readFileSync(join(DIR, f), 'utf8')
    .split('\n')
    .map((l) => l.replace(/--.*$/, ''))
    .join('\n');
const latest = (re: RegExp) => [...files].reverse().find((f) => re.test(sqlOf(f)))!;

describe('activate_client_subscription (latest definition)', () => {
  const sql = sqlOf(latest(/FUNCTION public\.activate_client_subscription/));

  it('accepts BUS and maps BUS→business, PRO→pro, BASIC→free', () => {
    expect(sql).toMatch(/p_tier NOT IN \('BASIC', 'PRO', 'BUS'\)/);
    expect(sql).toMatch(/WHEN 'BUS' THEN 'business'/);
    expect(sql).toMatch(/WHEN 'PRO' THEN 'pro'/);
    expect(sql).toMatch(/ELSE 'free'/);
    expect(sql).not.toMatch(/'starter'::public\.subscription_tier/);
  });

  it('keeps the service-role guard and the service_role-only grant', () => {
    expect(sql).toMatch(/COALESCE\(auth\.role\(\), ''\) <> 'service_role'/);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.activate_client_subscription\([^)]*\) TO service_role/);
  });
});

describe('user_entitlements tier CHECK (latest definition)', () => {
  it('accepts BUS', () => {
    const sql = sqlOf(latest(/user_entitlements_tier_check/));
    expect(sql).toMatch(/user_entitlements_tier_check CHECK \(tier IN \('BASIC', 'PRO', 'BUS'\)\)/);
  });
});

describe('OmniDash policies (WP-01 migration)', () => {
  const sql = sqlOf('20260928020000_activation_rpc_business_free_tiers.sql');
  const tables = [
    'omnidash_incidents',
    'omnidash_kpi_daily',
    'omnidash_pipeline_items',
    'omnidash_settings',
    'omnidash_today_items',
  ];

  it('rewrites exactly the five live policies without is_paid_user', () => {
    expect(sql).not.toMatch(/is_paid_user/);
    for (const t of tables) expect(sql).toMatch(new RegExp(`CREATE POLICY "[^"]+" ON public\\.${t}\\b`));
    expect(sql.match(/CREATE POLICY/g)).toHaveLength(5);
  });

  it('keeps the ownership predicate byte-identical in USING and WITH CHECK', () => {
    const expr = '((public.is_admin(auth.uid()) OR (select auth.uid()) IS NOT NULL) AND (user_id = auth.uid()))';
    expect(sql.split(`USING ${expr}`).length - 1).toBe(5);
    expect(sql.split(`WITH CHECK ${expr}`).length - 1).toBe(5);
  });

  it('rollback restores the paid-gated policies and the original CHECK', () => {
    const rb = readFileSync(
      join(DIR, 'rollback/20260928020000_activation_rpc_business_free_tiers_rollback.sql'),
      'utf8'
    );
    expect(rb.split('public.is_paid_user(auth.uid())').length - 1).toBe(10);
    expect(rb).toMatch(/CHECK \(tier IN \('BASIC', 'PRO'\)\)/);
    expect(rb).toMatch(/v_subscription_tier := 'starter'::public\.subscription_tier/);
  });
});
