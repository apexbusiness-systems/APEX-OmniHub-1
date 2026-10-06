import { useCallback, useMemo } from 'react';
import { Shield, Database, Lock, Key, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useOmniModuleState } from '@/hooks/useOmniModuleState';
import { ModuleShell } from './ModuleShell';
import { exportAuditLogCSV } from '@/dashboard/utils/exportAuditLog';
import { usePlan } from '@/hooks/usePlan';
import type { ModuleListItem } from '@/dashboard/components/ModuleRegistry';
import { ArmageddonCertificationPlaque } from '@/dashboard/components/ArmageddonCertificationPlaque';

interface ComplianceCheckResult {
  readonly label: string;
  readonly pass: boolean;
  readonly detail: string;
}

/**
 * Real signal rollup — every check queries live, RLS-scoped data for the
 * authenticated user. No invented scoring: a check either has real evidence
 * to report or is skipped, never a fabricated pass.
 */
async function runComplianceCheck(): Promise<{ ok: boolean; message: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Sign in required to run a compliance check.' };

  const results: ComplianceCheckResult[] = [];

  // Zero-Trust: a production *build* flag is NOT evidence that zero-trust
  // controls are operating at runtime, and must not inflate this compliance
  // check to passing. Runtime enforcement (RLS, auth gating, service-role
  // isolation) can only be attested server-side. Until a real server-side
  // attestation signal is wired, report this honestly as unverified rather
  // than deriving a green pass from the client build mode.
  results.push({
    label: 'Zero-Trust Policy',
    pass: false,
    detail: 'Unverified in client — requires server-side validation of runtime enforcement',
  });

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: auditCount, error: auditError } = await supabase
    .from('audit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('actor_id', user.id)
    .gte('created_at', since24h);
  results.push({
    label: 'Audit Trail Activity',
    pass: !auditError,
    detail: auditError ? `Query failed: ${auditError.message}` : `${auditCount ?? 0} event(s) in the last 24h`,
  });

  const { data: opsControls, error: opsError } = await supabase
    .from('user_ops_controls')
    .select('guardian_mode')
    .eq('user_id', user.id)
    .maybeSingle();
  const guardianOn = opsControls?.guardian_mode === true;
  results.push({
    label: 'Guardian Mode',
    pass: guardianOn,
    detail: opsError ? `Query failed: ${opsError.message}` : guardianOn ? 'Active' : 'Not enabled',
  });

  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: failedRunCount, error: runError } = await supabase
    .from('workflow_runs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'failed')
    .gte('created_at', since7d);
  results.push({
    label: 'Workflow Health',
    pass: !runError && (failedRunCount ?? 0) === 0,
    detail: runError
      ? `Query failed: ${runError.message}`
      : (failedRunCount ?? 0) === 0
        ? 'No failed runs in the last 7 days'
        : `${failedRunCount} failed run(s) in the last 7 days`,
  });

  const passCount = results.filter((r) => r.pass).length;
  const summary = results.map((r) => `${r.pass ? '✓' : '✗'} ${r.label}: ${r.detail}`).join(' | ');
  return { ok: passCount === results.length, message: `${passCount}/${results.length} checks passing — ${summary}` };
}

interface Props {
  readonly onClose: () => void;
}

// Baseline tiles shown regardless of live state — avoids blank tile syndrome.
interface AuditCategory {
  readonly id: string;
  readonly icon: typeof Shield;
  readonly label: string;
  readonly baseline: string;
}

const AUDIT_CATEGORIES: readonly AuditCategory[] = [
  { id: 'aud-001', icon: Shield,   label: 'Security Controls',  baseline: 'Roadmap assessment' },
  { id: 'aud-002', icon: Database, label: 'Data Processing',    baseline: 'Activity audit' },
  { id: 'aud-003', icon: Lock,     label: 'Zero-Trust Policy',  baseline: 'Policy enforcement' },
  { id: 'aud-004', icon: Key,      label: 'API Access Trail',   baseline: 'Request logging' },
];

function AuditTile({
  category,
  item,
}: {
  category: AuditCategory;
  item: ModuleListItem | undefined;
}) {
  const Icon   = category.icon;
  const active = item?.status === 'active';
  const color  = active ? '#34d399' : '#6b7280';
  const detail = item?.detail ?? category.baseline;

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 9,
      padding: '8px 10px', borderRadius: 8,
      border: `1px solid ${color}22`,
      background: `${color}06`,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
        background: `${color}14`, border: `1px solid ${color}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon style={{ width: 13, height: 13, color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--omni-t1, #e2e8f0)', lineHeight: 1.3 }}>
          {item?.label ?? category.label}
        </div>
        <div style={{ fontSize: 10, color: 'var(--omni-t3, #64748b)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {detail}
        </div>
      </div>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {active
          ? <CheckCircle style={{ width: 13, height: 13, color: '#34d399' }} />
          : <Clock       style={{ width: 13, height: 13, color: '#6b7280' }} />
        }
      </div>
    </div>
  );
}

export default function AuditsModule({ onClose }: Props) {
  const state = useOmniModuleState('audits');

  const itemsById = useMemo(
    () => new Map(state.items.map((i) => [i.id, i])),
    [state.items],
  );

  const allClear = state.items.length > 0 && state.items.every((i) => i.status === 'active');

  // Always render audit tiles (never blank) — use live item when available,
  // fall back to static category baseline when state is unavailable.
  const shellState = useMemo(() => ({ ...state, items: [] as readonly ModuleListItem[] }), [state]);

  const { canAccessPhysiOmni: isBusinessOrAbove } = usePlan(); // usePlan: true when tier >= business
  const handleAction = useCallback(async (actionId: string): Promise<boolean | string> => {
    if (actionId === 'export-audit') {
      if (!isBusinessOrAbove) return 'Audit exports are included in the Business plan.';
      const result = await exportAuditLogCSV();
      return result.message;
    }
    if (actionId === 'run-compliance') {
      const result = await runComplianceCheck();
      return result.message;
    }
    return false;
  }, [isBusinessOrAbove]);

  return (
    <ModuleShell state={shellState} onClose={onClose} onAction={handleAction}>
      {/* Official Armageddon Level 7 Security Certification Plaque */}
      <ArmageddonCertificationPlaque className="mb-4" />

      {/* Compliance summary — visible whenever we have any data */}
      {!state.loading && (
        <div className="rounded-lg border border-border/30 px-3 py-2 bg-muted/10">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Compliance Status
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`inline-block h-2 w-2 rounded-full ${allClear ? 'bg-green-400' : 'bg-yellow-400'}`} />
            <span className="text-foreground font-medium">
              {allClear ? 'All controls passing' : 'Audit in progress'}
            </span>
          </div>
        </div>
      )}

      {/* Audit category tiles — always rendered, never blank */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {AUDIT_CATEGORIES.map((cat) => (
          <AuditTile key={cat.id} category={cat} item={itemsById.get(cat.id)} />
        ))}
      </div>
    </ModuleShell>
  );
}
