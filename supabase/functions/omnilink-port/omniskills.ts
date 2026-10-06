interface QueryResult<T> {
  data: T | null;
  error: unknown;
  count?: number | null;
}

interface QueryBuilder<T> extends PromiseLike<QueryResult<T>> {
  select(columns: string, options?: { count?: 'exact'; head?: boolean }): QueryBuilder<T>;
  eq(column: string, value: unknown): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  maybeSingle(): Promise<QueryResult<T>>;
}

export interface OmniSkillsClient {
  from<T = unknown>(table: string): QueryBuilder<T>;
}

export interface OmniSkillsState {
  State: 'Online';
  items: Array<{ id: string; label: string; status: 'active'; detail: string }>;
  actions: string[];
  count: number;
  stats: Array<{ label: string; value: string }>;
}

/**
 * Resolve the authenticated user's real SkillForge entitlement state.
 * Both tables are RLS-scoped, so no caller-supplied user id is trusted here.
 */
export async function resolveOmniSkills(client: OmniSkillsClient): Promise<OmniSkillsState> {
  const [entitlementResult, skillsResult] = await Promise.all([
    client
      .from<{ tier: string }>('user_entitlements')
      .select('tier')
      .limit(1)
      .maybeSingle(),
    client
      .from('user_generated_skills')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
  ]);

  if (entitlementResult.error || skillsResult.error) {
    throw new Error('omniskills_query_failed');
  }

  const entTier = entitlementResult.data?.tier;
  const tier = entTier === 'PRO' || entTier === 'BUS' ? entTier : 'BASIC'; // BUS >= PRO (F-24)
  const unlimited = tier !== 'BASIC';
  const used = skillsResult.count ?? 0;
  const limit = unlimited ? 'Unlimited' : '5';

  return {
    State: 'Online',
    items: [{
      id: 'active-skills',
      label: 'Active Skills',
      status: 'active',
      detail: unlimited ? String(used) : `${used}/5`,
    }],
    actions: ['forge-skill', 'manage-bundles'],
    count: used,
    stats: [
      { label: 'Plan', value: tier },
      { label: 'Free Skills Used', value: unlimited ? `${used}/${limit}` : `${used}/5` },
    ],
  };
}

