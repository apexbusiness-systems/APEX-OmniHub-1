/**
 * apexAppsResolve — Deterministic prompt → APEX app resolution.
 *
 * Separated from ApexAppsMcpModule.tsx to satisfy react-refresh/only-export-components
 * (the module file may export only its component). Pure + unit-testable.
 *
 * OWNED BY: APEX Business Systems Ltd.
 */
import { LIVE_APEX_APPS } from '../../contracts/apexApps';

export type ApexApp = (typeof LIVE_APEX_APPS)[number];

/** Resolve a free-text prompt to a known APEX ecosystem app. */
export function resolveApexApp(prompt: string): ApexApp | null {
  const q = prompt.trim().toLowerCase();
  if (!q) return null;

  // 1. Exact id or label match.
  const exact = LIVE_APEX_APPS.find(
    (a) => a.id === q || a.label.toLowerCase() === q,
  );
  if (exact) return exact;

  // 2. Substring match on id, label, or canonical URL.
  const sub = LIVE_APEX_APPS.find(
    (a) =>
      q.includes(a.id) ||
      q.includes(a.label.toLowerCase()) ||
      a.label.toLowerCase().includes(q) ||
      a.id.includes(q) ||
      q.includes(a.url.toLowerCase()) ||
      a.url.toLowerCase().includes(q),
  );
  if (sub) return sub;

  // 3. Normalized alphanumeric match (handles spaced/hyphenated tokens e.g. "flow bills").
  const cleanQ = q.replace(/[^a-z0-9]/g, '');
  if (!cleanQ) return null;

  return (
    LIVE_APEX_APPS.find((a) => {
      const cleanId = a.id.replace(/[^a-z0-9]/g, '');
      const cleanLabel = a.label.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        cleanQ.includes(cleanId) ||
        cleanQ.includes(cleanLabel) ||
        cleanId.includes(cleanQ) ||
        cleanLabel.includes(cleanQ)
      );
    }) ?? null
  );
}
