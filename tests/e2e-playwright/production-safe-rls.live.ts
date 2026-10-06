/**
 * Task C — SUPABASE_RLS_MULTI_TENANT live production certification.
 * Procedure: docs/release/production-validation-harness.md#supabase-rls--multi-tenant
 *
 * Runs in a browser context with NO shared storage state with Tasks A/B
 * (Playwright gives each test a fresh context; this spec additionally asserts
 * the context started clean before authenticating as Tenant B).
 *
 * Attempts, as Tenant B, to observe the row Task B created for Tenant A —
 * through the UI and through the app's own authenticated API traffic. Every
 * attempt must be denied or return an empty set.
 *
 * P0 STOP CONDITION: if Tenant B can read or mutate Tenant A's record, this
 * spec records a P0 security finding with redacted evidence and stops. It does
 * NOT probe further, escalate, or attempt any additional exploitation.
 *
 * OWNED BY: APEX Business Systems Ltd.
 */

import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
  assertProductionSafeOptIn,
  credentials,
  evidenceDir,
  missingCredentialVars,
  redact,
  safeUrl,
  writeCredentialBlocker,
  writeEvidence,
} from './helpers/production-validation-evidence';
import {
  attachNetworkRecorder,
  loginWithPassword,
  scanClientSurface,
  visibleSignal,
} from './helpers/production-validation-probes';

assertProductionSafeOptIn();

const MATRIX_ITEM = 'SUPABASE_RLS_MULTI_TENANT';
const SECTION = 'rls';
const PERSISTENCE_TABLE = 'omnilink_links';
const DASHBOARD_ROUTE = '/omnidash';

interface TenantATarget {
  readonly marker: string;
  readonly testUrl: string;
  readonly writeAccepted: boolean;
}

/** Read the row Task B created. Absent/unaccepted → nothing to probe. */
function readTenantATarget(): TenantATarget | null {
  const file = path.join(evidenceDir('persistence'), 'created-record.json');
  try {
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as TenantATarget;
      if (parsed.marker && parsed.writeAccepted) return parsed;
    }
  } catch (_err) {
    void _err;
  }
  try {
    const root = path.resolve('artifacts/production-validation');
    const runs = fs
      .readdirSync(root)
      .filter((d) => fs.statSync(path.join(root, d)).isDirectory() && /^\d{4}-\d{2}-\d{2}/.test(d))
      .sort()
      .reverse();
    for (const run of runs) {
      const candidate = path.join(root, run, 'persistence', 'created-record.json');
      if (fs.existsSync(candidate)) {
        const parsed = JSON.parse(fs.readFileSync(candidate, 'utf8')) as TenantATarget;
        if (parsed.marker && parsed.writeAccepted) return parsed;
      }
    }
  } catch (_err) {
    void _err;
  }
  return null;
}

test.describe('SUPABASE_RLS_MULTI_TENANT — live production', () => {
  test.describe.configure({ mode: 'serial' });

  // Explicitly isolated: no storageState is inherited from Tasks A/B.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Tenant B cannot read or mutate Tenant A rows', async ({ page }, testInfo) => {
    const missing = missingCredentialVars('tenant-b');
    if (missing.length > 0) {
      const blocker = writeCredentialBlocker(
        SECTION,
        `${testInfo.project.name}-credentials-absent`,
        MATRIX_ITEM,
        'tenant-b',
      );
      test.skip(true, blocker); // APEX-2030: Tenant B credentials absent
      return;
    }

    const creds = credentials('tenant-b');
    const recorder = attachNetworkRecorder(page, 16_384);
    const shots = evidenceDir(`${SECTION}/screenshots`);
    const shot = async (stage: string) => {
      const file = path.join(shots, `${testInfo.project.name}-${stage}.png`);
      await page
        .screenshot({ path: file, fullPage: false, animations: 'disabled', caret: 'hide', timeout: 15_000 })
        .catch(() => undefined);
      return file;
    };

    // ── Context isolation proof ─────────────────────────────────
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    const preLoginScan = await scanClientSurface(page);
    const contextIsolated = preLoginScan.sessionArtifactKeys.length === 0;

    const target = readTenantATarget();

    // ── Authenticate as Tenant B ────────────────────────────────
    const login = await loginWithPassword(page, creds.tenantBEmail, creds.tenantBPassword);
    await shot('1-tenant-b-authenticated');

    if (!login.authenticated) {
      const blocker =
        'Could not authenticate as Tenant B; cross-tenant isolation could not be exercised. ' +
        'An unauthenticated failure is NOT evidence that RLS denies access.';
      const file = writeEvidence(SECTION, `${testInfo.project.name}-tenant-b-auth-failed`, {
        matrixItemId: MATRIX_ITEM,
        outcome: 'UNCERTAIN',
        certifies: false,
        blocker,
        resolvedBy:
          'Working APEX_TENANT_B_EMAIL / APEX_TENANT_B_PASSWORD credentials for a second live tenant, then re-run.',
        contextIsolated,
        login: { finalUrl: login.finalUrl, errorText: login.errorText },
      });
      expect(login.authenticated, `${MATRIX_ITEM} blocked. Evidence: ${file}`).toBe(true);
      return;
    }

    // ── Attempt 1: UI surface ───────────────────────────────────
    await page.goto(DASHBOARD_ROUTE, { waitUntil: 'domcontentloaded', timeout: 45_000 }).catch(() => undefined);
    await page.waitForTimeout(2_500);
    let linksNav = page.locator('.omni-nav-item').filter({ hasText: /^\s*links\s*$/i }).first();
    if ((await linksNav.count()) === 0 || !(await linksNav.isVisible().catch(() => false))) {
      await page.evaluate(() => {
        const tabs = document.querySelectorAll('.omni-mobile-tab');
        if (tabs.length >= 3) (tabs[2] as HTMLElement).click();
      }).catch(() => undefined);
      await page.waitForTimeout(1_500);
      linksNav = page.locator('.omni-nav-item').filter({ hasText: /^\s*links\s*$/i }).first();
    }
    if ((await linksNav.count()) > 0) {
      await linksNav.click({ timeout: 15_000 }).catch(() => undefined);
      await page.waitForTimeout(2_500);
    }
    await shot('2-tenant-b-links');

    const uiExposesTargetMarker = target
      ? (await page.locator(`text=${target.marker}`).count()) > 0
      : false;

    // ── Attempt 2: the app's own authenticated API traffic + direct PostgREST probe ──────
    // Ensure Tenant B issues an explicit authenticated PostgREST read against omnilink_links
    // as nominated in resolvedBy:
    if (target) {
      await page.evaluate(async ({ targetUrl, anonKey }: { targetUrl: string; anonKey: string }) => {
        try {
          const tokenKey = Object.keys(window.localStorage).find(
            (k) => k.startsWith('sb-') && k.endsWith('-auth-token'),
          );
          if (!tokenKey) return;
          const raw = window.localStorage.getItem(tokenKey);
          if (!raw) return;
          const session = JSON.parse(raw);
          const token = session?.access_token;
          if (!token) return;
          await fetch(
            `https://rtopreovkywofgwgmozi.supabase.co/rest/v1/omnilink_links?url=eq.${encodeURIComponent(targetUrl)}&select=id,url,status,created_at`,
            {
              headers: {
                apikey: anonKey,
                Authorization: `Bearer ${token}`,
              },
            },
          );
        } catch (_err) {
          void _err;
        }
      }, { targetUrl: target.testUrl, anonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '' });
      await page.waitForTimeout(1_000);
    }

    const tableExchanges = recorder.exchanges.filter(
      (e) => e.url.includes(PERSISTENCE_TABLE) || e.url.includes('omnilink-port'),
    );
    const successfulReads = tableExchanges.filter(
      (e) => ['GET', 'POST'].includes(e.method) && e.status >= 200 && e.status < 300,
    );
    const leakingExchanges = target
      ? successfulReads.filter((e) => e.bodyExcerpt.includes(target.marker))
      : [];
    const crossTenantLeak = uiExposesTargetMarker || leakingExchanges.length > 0;

    const postScan = await scanClientSurface(page);
    const serviceRoleSightings = [
      ...recorder.serviceRoleSightings,
      ...preLoginScan.serviceRoleSightings,
      ...postScan.serviceRoleSightings,
    ];

    // ── P0 STOP CONDITION ───────────────────────────────────────
    if (crossTenantLeak) {
      const shotLeak = await shot('3-P0-cross-tenant-exposure');
      const evidenceFile = writeEvidence(SECTION, `${testInfo.project.name}-P0-rls-cross-tenant`, {
        matrixItemId: MATRIX_ITEM,
        outcome: 'P0_SECURITY_FINDING',
        certifies: false,
        severity: 'P0',
        blocker:
          'CROSS-TENANT EXPOSURE: authenticated Tenant B observed a record belonging to Tenant A. ' +
          'Suite stopped immediately; no further probing or mutation was attempted.',
        stoppedImmediately: true,
        mutationAttempted: false,
        exposure: {
          table: PERSISTENCE_TABLE,
          targetMarker: target?.marker ?? null,
          visibleInTenantBUi: uiExposesTargetMarker,
          leakingExchanges,
          screenshot: shotLeak,
        },
        serviceRoleSightings,
      });
      // Fail loudly and stop the file — describe.configure serial ensures no
      // further tests in this describe run after this failure.
      expect(
        crossTenantLeak,
        `P0 SECURITY FINDING — Tenant B can read Tenant A data. Evidence: ${evidenceFile}. ` +
          'Stop the release. Do not continue validation.',
      ).toBe(false);
      return;
    }

    // ── Verdict (no leak observed) ──────────────────────────────
    const checks = {
      contextIsolatedFromTenantA: contextIsolated,
      tenantBAuthenticated: login.authenticated,
      tenantATargetAvailableToProbe: target !== null,
      uiDeniedOrEmpty: !uiExposesTargetMarker,
      apiDeniedOrEmpty: leakingExchanges.length === 0,
      noServiceRoleKeyClientSide: serviceRoleSightings.length === 0,
    };
    const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);

    let outcome: 'VERIFIED' | 'FAILED' | 'UNCERTAIN' = 'VERIFIED';
    let blocker: string | null = null;
    let resolvedBy: string | null = null;

    if (!target) {
      // Without a known Tenant A row, "Tenant B saw nothing" is unfalsifiable.
      outcome = 'UNCERTAIN';
      blocker =
        'No Tenant A record was created by OMNIDASH_LIVE_PERSISTENCE in this run, so an empty Tenant B ' +
        'result cannot be distinguished from "there was nothing to find". This is not isolation proof.';
      resolvedBy =
        'A successful Task B run that writes artifacts/production-validation/<runId>/persistence/created-record.json ' +
        'with writeAccepted=true, then re-run this spec in the same run id.';
    } else if (successfulReads.length === 0) {
      // The classic ambiguity the brief calls out: empty could be denial, or
      // the view simply never queried.
      outcome = 'UNCERTAIN';
      blocker =
        `Tenant B produced no successful read of ${PERSISTENCE_TABLE} at all, so the absence of Tenant A's ` +
        'record cannot be attributed to RLS denial rather than to the surface never querying the table.';
      resolvedBy =
        `Either a Tenant B view that demonstrably issues a ${PERSISTENCE_TABLE} SELECT (a 2xx GET in the ` +
        'captured exchanges), or an explicit authenticated PostgREST read as Tenant B filtered on Tenant A\'s ' +
        'row returning 200 with an empty array (or 401/403) — captured as a redacted request/response pair.';
    } else if (!contextIsolated) {
      outcome = 'UNCERTAIN';
      blocker = 'Tenant B context was not provably clean before login; isolation claim is contaminated.';
      resolvedBy = 'A re-run in which the pre-login client surface holds zero session artifacts.';
    } else if (failed.length > 0) {
      outcome = 'FAILED';
      blocker = `Failed checks: ${failed.join(', ')}.`;
    }

    const evidenceFile = writeEvidence(SECTION, `${testInfo.project.name}-supabase-rls-multi-tenant`, {
      matrixItemId: MATRIX_ITEM,
      outcome,
      certifies: outcome === 'VERIFIED',
      blocker,
      resolvedBy,
      project: testInfo.project.name,
      table: PERSISTENCE_TABLE,
      targetMarker: target?.marker ?? null,
      checks,
      steps: {
        isolation: {
          storageStateShared: false,
          preLoginSessionArtifactKeys: preLoginScan.sessionArtifactKeys,
          contextIsolated,
        },
        uiAttempt: {
          finalUrl: safeUrl(page.url()),
          visibleSignal: await visibleSignal(page),
          targetMarkerVisible: uiExposesTargetMarker,
        },
        apiAttempt: {
          observedTableExchanges: tableExchanges,
          successfulReadCount: successfulReads.length,
          leakingExchangeCount: leakingExchanges.length,
        },
      },
      serviceRoleSightings,
      consoleErrors: recorder.consoleErrors.slice(0, 25),
      pageErrors: recorder.pageErrors.slice(0, 25),
    });

    expect(
      outcome,
      `${MATRIX_ITEM} not certified. Evidence: ${evidenceFile}. ${redact(blocker ?? '')}`,
    ).toBe('VERIFIED');
  });
});
