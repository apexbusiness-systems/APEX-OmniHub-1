/**
 * Negative controls — the parts of Tasks A and C that are certifiable WITHOUT
 * owner credentials, so a credential-less run still produces real live
 * evidence instead of nothing.
 *
 * These are controls, not certifications: they can only ever *falsify*. A
 * clean result here does not move AUTH_EMAIL_PASSWORD or
 * SUPABASE_RLS_MULTI_TENANT — those need the authenticated specs. A dirty
 * result fails the run outright.
 *
 * Covered:
 *  - unauthenticated access to protected routes is denied (Task A stage 0),
 *  - no Supabase service-role credential is reachable from the client on any
 *    public surface or in the shipped bundle (Task C requirement),
 *  - the anon key actually shipped to the browser claims role=anon, never
 *    role=service_role.
 *
 * OWNED BY: APEX Business Systems Ltd.
 */

import { expect, test } from '@playwright/test';
import {
  assertProductionSafeOptIn,
  redact,
  safeUrl,
  writeEvidence,
} from './helpers/production-validation-evidence';
import {
  attachNetworkRecorder,
  findServiceRoleSightings,
  jwtClaimsRole,
  scanClientSurface,
  visibleSignal,
} from './helpers/production-validation-probes';

assertProductionSafeOptIn();

const SECTION = 'negative-controls';
const PROTECTED_ROUTES = ['/omnidash'] as const;

test.describe('production-safe negative controls', () => {
  test('unauthenticated access to protected routes is denied', async ({ page }, testInfo) => {
    const recorder = attachNetworkRecorder(page);
    const results = [];

    for (const route of PROTECTED_ROUTES) {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await page.waitForTimeout(2_000);
      const signal = await visibleSignal(page);
      const scan = await scanClientSurface(page);
      const gated =
        /\/(login|auth)\b/.test(page.url()) ||
        /sign in|log in|welcome back|request access|authenticate|protected/i.test(signal);
      results.push({
        route,
        finalUrl: safeUrl(page.url()),
        visibleSignal: signal,
        gated,
        sessionArtifactKeys: scan.sessionArtifactKeys,
      });
    }

    const allGated = results.every((r) => r.gated);
    const noSessionLeak = results.every((r) => r.sessionArtifactKeys.length === 0);

    const file = writeEvidence(SECTION, `${testInfo.project.name}-unauthenticated-gating`, {
      matrixItemId: 'AUTH_EMAIL_PASSWORD',
      outcome: allGated && noSessionLeak ? 'VERIFIED' : 'FAILED',
      // A control never certifies the matrix item on its own.
      certifies: false,
      blocker: allGated
        ? 'Control only: proves the logged-out gate, not that a real login succeeds. AUTH_EMAIL_PASSWORD still needs the authenticated spec.'
        : 'Protected route rendered without authentication.',
      checks: { allGated, noSessionLeak },
      routes: results,
      consoleErrors: recorder.consoleErrors.slice(0, 25),
      pageErrors: recorder.pageErrors.slice(0, 25),
    });

    expect(allGated, `Unauthenticated protected-route access. Evidence: ${file}`).toBe(true);
    expect(noSessionLeak, `Session artifact present without login. Evidence: ${file}`).toBe(true);
  });

  test('no service-role credential is reachable from the client', async ({ page }, testInfo) => {
    const recorder = attachNetworkRecorder(page);
    const scans = [];

    for (const route of ['/', '/login', '/omnidash']) {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 45_000 }).catch(() => undefined);
      await page.waitForTimeout(1_500);
      const scan = await scanClientSurface(page);
      scans.push({ route, sightings: scan.serviceRoleSightings, cookieNames: scan.cookieNames });
    }

    // Inspect the shipped JS bundles the browser actually loaded.
    const bundleSightings: string[] = [];
    const anonKeyRoles: string[] = [];
    const scriptUrls = await page.evaluate(() =>
      Array.from(document.querySelectorAll('script[src]')).map((s) => (s as HTMLScriptElement).src),
    );
    for (const src of scriptUrls.slice(0, 12)) {
      const body = await page.evaluate(
        async (url) => fetch(url).then((r) => r.text()).catch(() => ''),
        src,
      );
      bundleSightings.push(...findServiceRoleSightings(`bundle ${safeUrl(src)}`, body));
      for (const jwt of body.match(/\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\b/g) ?? []) {
        const role = jwtClaimsRole(jwt);
        if (role) anonKeyRoles.push(role);
      }
    }

    const allSightings = [
      ...recorder.serviceRoleSightings,
      ...scans.flatMap((s) => s.sightings),
      ...bundleSightings,
    ];
    const clean = allSightings.length === 0 && !anonKeyRoles.includes('service_role');

    const file = writeEvidence(SECTION, `${testInfo.project.name}-service-role-exposure`, {
      matrixItemId: 'SUPABASE_RLS_MULTI_TENANT',
      outcome: clean ? 'VERIFIED' : 'P0_SECURITY_FINDING',
      certifies: false,
      severity: clean ? null : 'P0',
      blocker: clean
        ? 'Control only: proves no client-side service-role exposure. SUPABASE_RLS_MULTI_TENANT still needs the two-tenant spec.'
        : 'A service-role credential is reachable from the browser.',
      checks: { noServiceRoleSightings: allSightings.length === 0, clientJwtRoles: anonKeyRoles },
      scannedRoutes: scans,
      scannedBundleCount: Math.min(scriptUrls.length, 12),
      sightings: allSightings.map((s) => redact(s)),
    });

    expect(clean, `Service-role credential reachable client-side. Evidence: ${file}`).toBe(true);
  });
});
