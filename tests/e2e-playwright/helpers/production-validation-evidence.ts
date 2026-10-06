/**
 * production-validation-evidence — shared primitives for the live
 * production-safe validation harness (`npm run test:e2e:production-safe`).
 *
 * This module is deliberately the ONLY place that knows how to:
 *  - enforce the fail-closed opt-in guard,
 *  - resolve owner-supplied credentials from the environment,
 *  - redact anything before it reaches disk,
 *  - write run-scoped evidence under artifacts/production-validation/<runId>/.
 *
 * NON-NEGOTIABLES ENCODED HERE:
 *  - Credentials are read from process.env only. They are never written to an
 *    evidence file, never logged, and never embedded in a spec.
 *  - Absent credentials never degrade into a pass. They produce a
 *    REQUIRES_MANUAL_VALIDATION evidence record with an explicit blocker.
 *  - Every evidence record carries `certifies` — the matrix may only be
 *    promoted from a record whose `certifies` is true.
 *
 * OWNED BY: APEX Business Systems Ltd.
 */

import fs from 'node:fs';
import path from 'node:path';

// ── Fail-closed opt-in guard ────────────────────────────────────

/**
 * Live production traffic is opt-in. Any live file importing this module must
 * call this at module scope so an accidental `playwright test` discovery run
 * throws instead of hitting production.
 */
export function assertProductionSafeOptIn(): void {
  if (process.env.APEX_RUN_PRODUCTION_SAFE !== 'true') {
    throw new Error(
      'Production-safe live validation is opt-in. Run with npm run test:e2e:production-safe.',
    );
  }
}

// ── Run identity / evidence roots ───────────────────────────────

export const EVIDENCE_ROOT = path.resolve('artifacts/production-validation');

/**
 * Stable per-invocation run id. Playwright re-evaluates the config in every
 * worker process, so the id is minted once by
 * scripts/ci/run-production-safe-validation.mjs and inherited through the
 * environment. The fallback keeps direct `playwright test -c ...` usable.
 */
export function runId(): string {
  const fromEnv = process.env.APEX_VALIDATION_RUN_ID;
  if (fromEnv && /^[0-9A-Za-z._-]+$/.test(fromEnv)) return fromEnv;
  return `unpinned-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
}

export function runDir(): string {
  return path.join(EVIDENCE_ROOT, runId());
}

export function evidenceDir(section: string): string {
  const dir = path.join(runDir(), section);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// ── Redaction ───────────────────────────────────────────────────

const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\b/g;

/**
 * Single redaction gate. Applied to every string that reaches an evidence
 * file. Order matters: JWTs first (they contain '.' and would survive the
 * key=value rule), then bearer headers, then key=value pairs, then emails.
 */
export function redact(value: string): string {
  return value
    .replace(JWT_PATTERN, '[redacted-jwt]')
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer [redacted]')
    .replace(
      /(access_token|refresh_token|id_token|provider_token|apikey|api_key|code|token|key|password|secret)([=":\s]+)([^&"',\s}]+)/gi,
      '$1$2[redacted]',
    )
    .replace(/\bsb[ap]?_[A-Za-z0-9_-]{10,}\b/g, '[redacted-supabase-key]')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[redacted-email]');
}

/** URL with query and fragment stripped — query strings carry auth codes. */
export function safeUrl(value: string): string {
  try {
    const parsed = new URL(value);
    parsed.search = parsed.search ? '?[redacted-query]' : '';
    parsed.hash = '';
    return redact(parsed.toString());
  } catch {
    return redact(value);
  }
}

/** Deep-redact an arbitrary JSON-serialisable payload before it hits disk. */
export function redactDeep<T>(payload: T): T {
  return JSON.parse(
    JSON.stringify(payload, (_key, value) => (typeof value === 'string' ? redact(value) : value)),
  ) as T;
}

// ── Credentials ─────────────────────────────────────────────────

export interface ValidationCredentials {
  readonly baseUrl: string;
  readonly ownerEmail: string;
  readonly ownerPassword: string;
  readonly tenantBEmail: string;
  readonly tenantBPassword: string;
}

const CREDENTIAL_VARS = {
  ownerEmail: 'APEX_TEST_USER_EMAIL',
  ownerPassword: 'APEX_TEST_USER_PASSWORD',
  tenantBEmail: 'APEX_TENANT_B_EMAIL',
  tenantBPassword: 'APEX_TENANT_B_PASSWORD',
} as const;

export type CredentialScope = 'owner' | 'tenant-b' | 'both';

const SCOPE_VARS: Record<CredentialScope, ReadonlyArray<keyof typeof CREDENTIAL_VARS>> = {
  owner: ['ownerEmail', 'ownerPassword'],
  'tenant-b': ['tenantBEmail', 'tenantBPassword'],
  both: ['ownerEmail', 'ownerPassword', 'tenantBEmail', 'tenantBPassword'],
};

export function baseUrl(): string {
  return process.env.APEX_PROD_URL || 'https://apexomnihub.icu';
}

/** Names (never values) of the credential variables missing for a scope. */
export function missingCredentialVars(scope: CredentialScope): string[] {
  return SCOPE_VARS[scope]
    .filter((field) => !process.env[CREDENTIAL_VARS[field]]?.trim())
    .map((field) => CREDENTIAL_VARS[field]);
}

/**
 * Resolve credentials. Throws rather than returning partials — a half-set of
 * credentials is exactly the "partial signal" the standard forbids.
 */
export function credentials(scope: CredentialScope): ValidationCredentials {
  const missing = missingCredentialVars(scope);
  if (missing.length > 0) {
    throw new Error(`Missing required credential variables: ${missing.join(', ')}`);
  }
  return {
    baseUrl: baseUrl(),
    ownerEmail: process.env[CREDENTIAL_VARS.ownerEmail] ?? '',
    ownerPassword: process.env[CREDENTIAL_VARS.ownerPassword] ?? '',
    tenantBEmail: process.env[CREDENTIAL_VARS.tenantBEmail] ?? '',
    tenantBPassword: process.env[CREDENTIAL_VARS.tenantBPassword] ?? '',
  };
}

// ── Evidence records ────────────────────────────────────────────

export type EvidenceOutcome =
  | 'VERIFIED'
  | 'FAILED'
  | 'UNCERTAIN'
  | 'REQUIRES_MANUAL_VALIDATION'
  | 'P0_SECURITY_FINDING';

export interface EvidenceRecord {
  /** Release-validation-matrix item this record speaks to. */
  readonly matrixItemId: string;
  readonly outcome: EvidenceOutcome;
  /**
   * True only when this record is sufficient, on its own, to move the matrix
   * item to VERIFIED. Any UNCERTAIN / missing-credential path sets false.
   */
  readonly certifies: boolean;
  readonly blocker: string | null;
  /** What signal would resolve an UNCERTAIN outcome. Required when UNCERTAIN. */
  readonly resolvedBy?: string | null;
  readonly steps?: unknown;
  readonly [key: string]: unknown;
}

/** Write a redacted evidence record and return its absolute path. */
export function writeEvidence(section: string, name: string, record: EvidenceRecord): string {
  const dir = evidenceDir(section);
  const file = path.join(dir, `${name}.json`);
  const payload = redactDeep({
    generatedAt: new Date().toISOString(),
    runId: runId(),
    baseUrl: safeUrl(baseUrl()),
    liveProductionTouched: true,
    ...record,
  });
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
  return file;
}

/**
 * Record the honest "credentials were not supplied" outcome for a task and
 * return the blocker text. Callers must then skip — never pass.
 */
export function writeCredentialBlocker(
  section: string,
  name: string,
  matrixItemId: string,
  scope: CredentialScope,
): string {
  const missing = missingCredentialVars(scope);
  const blocker =
    `Credentials absent: ${missing.join(', ')} not set in the validation environment. ` +
    'Live authenticated evidence could not be produced; item stays REQUIRES_MANUAL_VALIDATION.';
  writeEvidence(section, name, {
    matrixItemId,
    outcome: 'REQUIRES_MANUAL_VALIDATION',
    certifies: false,
    blocker,
    missingCredentialVars: missing,
    liveProductionTouched: false,
  });
  return blocker;
}
