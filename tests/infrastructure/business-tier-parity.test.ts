import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { entitlementTierFor } from '../../supabase/functions/_shared/stripeSubscriptionSync';

// APEX-REV-2026-09 WP-03 (F-24, F-25, L8): Business must never be treated below Pro.
const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');

describe('entitlementTierFor (lifecycle → skill caps)', () => {
  it('maps paid tiers and keeps access through dunning', () => {
    expect(entitlementTierFor('business', 'active')).toBe('BUS');
    expect(entitlementTierFor('enterprise', 'trialing')).toBe('BUS');
    expect(entitlementTierFor('pro', 'past_due')).toBe('PRO');
    expect(entitlementTierFor('free', 'active')).toBe('BASIC');
  });
  it('drops to BASIC when the subscription ends and never guesses unknown tiers', () => {
    for (const s of ['canceled', 'expired', 'paused'] as const) expect(entitlementTierFor('business', s)).toBe('BASIC');
    expect(entitlementTierFor(undefined, 'active')).toBeNull();
  });
});

describe('skill gates admit BUS like PRO', () => {
  it('DB migration changes only the PRO comparisons', () => {
    const sql = read('supabase/migrations/20260928030000_skill_entitlement_business_parity.sql');
    expect(sql).toContain("CASE WHEN user_tier IN ('PRO','BUS') THEN");
    expect(sql).toContain("IF user_tier IN ('PRO', 'BUS') THEN");
    expect(sql).not.toMatch(/user_tier\s*=\s*'PRO'/);
    expect(sql).toMatch(/REVOKE EXECUTE ON FUNCTION public\.enforce_skill_entitlement\(\)\s+FROM PUBLIC, anon, authenticated/);
  });
  it('omniskills treats BUS as unlimited', () => {
    const src = read('supabase/functions/omnilink-port/omniskills.ts');
    expect(src).toContain("entTier === 'PRO' || entTier === 'BUS'");
    expect(src).not.toMatch(/tier === 'PRO' \?/);
  });
});

describe('live client tier maps include business', () => {
  it('usePaidAccess ranks business between pro and enterprise', () => {
    const src = read('src/hooks/usePaidAccess.ts');
    expect(src).toContain("'free' | 'starter' | 'pro' | 'business' | 'enterprise'");
    expect(src).toMatch(/pro: 2,\s+business: 3,\s+enterprise: 4,/);
  });
  it('useCapabilities never lists pro without business, and Base can view OmniDash', () => {
    const src = read('src/hooks/useCapabilities.ts');
    expect(src).not.toMatch(/'pro', 'enterprise'/);
    expect(src).toMatch(/canViewOmniDash: isAdmin \|\| \['free', 'starter', 'pro', 'business', 'enterprise'\]/);
  });
  it('audit export is gated to business and above via usePlan', () => {
    const src = read('apps/omnihub-site/dashboard/components/modules/AuditsModule.tsx');
    expect(src).toContain("import { usePlan } from '@/hooks/usePlan'");
    expect(src).toMatch(/if \(!isBusinessOrAbove\) return /);
  });
});
