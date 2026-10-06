/**
 * Task A — AUTH_EMAIL_PASSWORD live production certification.
 * Procedure: docs/release/production-validation-harness.md#auth-oauth-and-passkey
 *
 * Extends the existing production-safe harness (same config, same opt-in
 * guard, same evidence root). Runs only under
 * `npm run test:e2e:production-safe`.
 *
 * Certification requires ALL of:
 *   1. valid login lands on an authenticated route,
 *   2. a session artifact exists client-side (name asserted, value never read),
 *   3. a protected route renders owner-specific content,
 *   4. sign-out really terminates the session — the protected route redirects
 *      back to login on a fresh navigation, not merely a UI state change.
 *
 * Missing credentials produce a REQUIRES_MANUAL_VALIDATION record and a skip.
 * They never produce a pass.
 *
 * OWNED BY: APEX Business Systems Ltd.
 */

import { expect, test } from '@playwright/test';
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
  signOut,
  visibleSignal,
} from './helpers/production-validation-probes';

assertProductionSafeOptIn();

const MATRIX_ITEM = 'AUTH_EMAIL_PASSWORD';
const SECTION = 'auth';
const PROTECTED_ROUTE = '/omnidash';

test.describe('AUTH_EMAIL_PASSWORD — live production', () => {
  // Auth flows are sequential and share one live account; parallel logins
  // would race on the same Supabase session.
  test.describe.configure({ mode: 'serial' });

  test('email/password login, protected route, and real session termination', async ({
    page,
  }, testInfo) => {
    const missing = missingCredentialVars('owner');
    if (missing.length > 0) {
      const blocker = writeCredentialBlocker(
        SECTION,
        `${testInfo.project.name}-credentials-absent`,
        MATRIX_ITEM,
        'owner',
      );
      test.skip(true, blocker); // APEX-2030: owner test-account credentials absent
      return;
    }

    const creds = credentials('owner');
    const recorder = attachNetworkRecorder(page);
    const shots = evidenceDir(`${SECTION}/screenshots`);
    const shot = async (stage: string) => {
      const file = path.join(shots, `${testInfo.project.name}-${stage}.png`);
      await page
        .screenshot({ path: file, fullPage: false, animations: 'disabled', caret: 'hide', timeout: 15_000 })
        .catch(() => undefined);
      return file;
    };

    // ── Stage 0: logged-out baseline on the protected route ──────
    // Establishes that the gate is real *before* we hold a session, so the
    // stage-3 assertion has a control to compare against.
    await page.goto(PROTECTED_ROUTE, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(1_500);
    const loggedOutUrl = safeUrl(page.url());
    const loggedOutSignal = await visibleSignal(page);
    const loggedOutGated =
      /\/(login|auth)\b/.test(page.url()) ||
      /sign in|log in|welcome back|request access|authenticate/i.test(loggedOutSignal);
    const shotLoggedOut = await shot('0-logged-out-protected-route');

    // ── Stage 1: login ──────────────────────────────────────────
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    const shotLoginForm = await shot('1-login-form');
    const login = await loginWithPassword(page, creds.ownerEmail, creds.ownerPassword);
    const shotAfterLogin = await shot('2-after-login');

    // ── Stage 2: protected route renders owner content ──────────
    if (!page.url().includes(PROTECTED_ROUTE)) {
      await page.goto(PROTECTED_ROUTE, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    }
    await page.waitForTimeout(2_000);
    const protectedUrl = safeUrl(page.url());
    const protectedSignal = await visibleSignal(page);
    const authenticatedScan = await scanClientSurface(page);
    const shotProtected = await shot('3-protected-route');

    // Owner-specific content: the authenticated shell exposes surfaces that
    // the login gate cannot render. Presence of the sign-out affordance is
    // the narrowest reliable owner-only signal.
    const signOutVisible =
      (await page.locator('button', { hasText: /sign out|log out|logout/i }).count()) > 0 ||
      (await page.locator('[data-testid="omnidash-sign-out"], [data-testid="omnidash-mobile-sign-out"]').count()) > 0 ||
      (await page.locator('.omni-mobile-bottom-nav, .omni-mobile-tab').count()) > 0;
    const dashboardSurface =
      (await page.locator('[data-testid="omnidash-canvas-logo"], .omni-nav-item, .omni-footer-bar').count()) > 0;
    const protectedRendersOwnerContent =
      !/\/(login|auth)\b/.test(page.url()) && (signOutVisible || dashboardSurface);

    // ── Stage 3: sign out, then re-navigate ─────────────────────
    const signOutFound = await signOut(page);
    const shotAfterSignOut = await shot('4-after-sign-out');

    // A fresh navigation (not client-side routing) is what proves the session
    // is gone server-side rather than merely hidden in the UI.
    await page.goto(PROTECTED_ROUTE, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(2_000);
    const postLogoutUrl = safeUrl(page.url());
    const postLogoutSignal = await visibleSignal(page);
    const postLogoutScan = await scanClientSurface(page);
    const sessionTerminated =
      postLogoutScan.sessionArtifactKeys.length === 0 &&
      (/\/(login|auth)\b/.test(page.url()) ||
        /sign in|log in|welcome back|request access|authenticate/i.test(postLogoutSignal));
    const shotPostLogout = await shot('5-post-logout-protected-route');

    // ── Verdict ─────────────────────────────────────────────────
    const checks = {
      loggedOutGateIsReal: loggedOutGated,
      loginRedirectedToAuthenticatedRoute: login.authenticated,
      sessionArtifactPresent: login.sessionArtifactKeys.length > 0,
      protectedRouteRendersOwnerContent: protectedRendersOwnerContent,
      signOutAffordanceFound: signOutFound,
      sessionTerminatedAfterSignOut: sessionTerminated,
      noServiceRoleKeyClientSide:
        recorder.serviceRoleSightings.length === 0 &&
        authenticatedScan.serviceRoleSightings.length === 0,
    };
    const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);

    let outcome: 'VERIFIED' | 'FAILED' | 'UNCERTAIN' = 'VERIFIED';
    let blocker: string | null = null;
    let resolvedBy: string | null = null;

    if (!checks.loginRedirectedToAuthenticatedRoute || !checks.sessionArtifactPresent) {
      outcome = 'FAILED';
      blocker = `Login did not establish an authenticated session. Failed checks: ${failed.join(', ')}.`;
    } else if (!checks.signOutAffordanceFound) {
      // We cannot distinguish "logout is broken" from "we could not find the
      // control" — that is exactly an UNCERTAIN, not a pass and not a fail.
      outcome = 'UNCERTAIN';
      blocker = 'Sign-out affordance was not locatable from the authenticated shell.';
      resolvedBy =
        'A stable data-testid on the OmniDashShell sign-out button (e.g. data-testid="omnidash-sign-out"), then re-run this spec.';
    } else if (failed.length > 0) {
      outcome = 'FAILED';
      blocker = `Failed checks: ${failed.join(', ')}.`;
    }

    const evidenceFile = writeEvidence(SECTION, `${testInfo.project.name}-auth-email-password`, {
      matrixItemId: MATRIX_ITEM,
      outcome,
      certifies: outcome === 'VERIFIED',
      blocker,
      resolvedBy,
      project: testInfo.project.name,
      protectedRoute: PROTECTED_ROUTE,
      checks,
      steps: {
        loggedOutBaseline: { finalUrl: loggedOutUrl, visibleSignal: loggedOutSignal, gated: loggedOutGated, screenshot: shotLoggedOut },
        loginForm: { screenshot: shotLoginForm },
        login: {
          finalUrl: login.finalUrl,
          authenticated: login.authenticated,
          errorText: login.errorText,
          // Names only. Values are never read from storage.
          sessionArtifactKeys: login.sessionArtifactKeys,
          screenshot: shotAfterLogin,
        },
        protectedRoute: {
          finalUrl: protectedUrl,
          visibleSignal: protectedSignal,
          signOutVisible,
          dashboardSurface,
          sessionArtifactKeys: authenticatedScan.sessionArtifactKeys,
          screenshot: shotProtected,
        },
        signOut: { affordanceFound: signOutFound, screenshot: shotAfterSignOut },
        postLogout: {
          finalUrl: postLogoutUrl,
          visibleSignal: postLogoutSignal,
          sessionArtifactKeys: postLogoutScan.sessionArtifactKeys,
          sessionTerminated,
          screenshot: shotPostLogout,
        },
      },
      serviceRoleSightings: [
        ...recorder.serviceRoleSightings,
        ...authenticatedScan.serviceRoleSightings,
      ],
      consoleErrors: recorder.consoleErrors.slice(0, 25),
      pageErrors: recorder.pageErrors.slice(0, 25),
    });

    // Fail closed: UNCERTAIN is not a pass. The record above is written first
    // so the blocker survives the assertion.
    expect(
      outcome,
      `${MATRIX_ITEM} not certified. Evidence: ${evidenceFile}. ${redact(blocker ?? '')}`,
    ).toBe('VERIFIED');
  });
});
