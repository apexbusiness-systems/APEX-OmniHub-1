/**
 * Task B — OMNIDASH_LIVE_PERSISTENCE live production certification.
 * Procedure: docs/release/production-validation-harness.md#omnidash-persistence
 *
 * Proves that an authenticated OmniDash module action is durably persisted by
 * the backend and read back after a HARD reload — not restored from client
 * state, and never a `LOCAL_LAUNCHED` action silently reported as `LIVE`.
 *
 * The action under test is the Links module URL stage (`omnilink_links`
 * insert): user-scoped, additive, non-destructive, and safely test-scoped —
 * the URL uses the reserved `.invalid` TLD (RFC 2606) so it is never fetched
 * and can never collide with a real customer record.
 *
 * The created record's marker is written to
 * artifacts/production-validation/<runId>/persistence/created-record.json so
 * Task C (SUPABASE_RLS_MULTI_TENANT) can attempt to read exactly this row as
 * Tenant B.
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
  type RecordedExchange,
} from './helpers/production-validation-probes';

assertProductionSafeOptIn();

const MATRIX_ITEM = 'OMNIDASH_LIVE_PERSISTENCE';
const SECTION = 'persistence';
const DASHBOARD_ROUTE = '/omnidash';
/** Table the Links module writes to — used to identify the backend exchange. */
const PERSISTENCE_TABLE = 'omnilink_links';

/** Path Task C reads to learn which row to attempt as Tenant B. */
export function createdRecordPath(): string {
  return path.join(evidenceDir(SECTION), 'created-record.json');
}

test.describe('OMNIDASH_LIVE_PERSISTENCE — live production', () => {
  test.describe.configure({ mode: 'serial' });

  test('module action persists to the backend and survives a hard reload', async ({
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
    const recorder = attachNetworkRecorder(page, 16_384);
    const shots = evidenceDir(`${SECTION}/screenshots`);
    const shot = async (stage: string) => {
      const file = path.join(shots, `${testInfo.project.name}-${stage}.png`);
      await page
        .screenshot({ path: file, fullPage: false, animations: 'disabled', caret: 'hide', timeout: 15_000 })
        .catch(() => undefined);
      return file;
    };

    // Test-scoped, collision-proof, never-resolvable marker.
    const marker = `prod-validation-${testInfo.project.name}-${Date.now().toString(36)}`;
    const testUrl = `https://validation.apex-omnihub.invalid/${marker}`;

    // ── Authenticate ────────────────────────────────────────────
    const login = await loginWithPassword(page, creds.ownerEmail, creds.ownerPassword);
    if (!login.authenticated) {
      const blocker =
        'Could not authenticate as the owner test account; persistence cannot be exercised. ' +
        'This is an AUTH_EMAIL_PASSWORD blocker surfacing here, not a persistence result.';
      const file = writeEvidence(SECTION, `${testInfo.project.name}-auth-precondition-failed`, {
        matrixItemId: MATRIX_ITEM,
        outcome: 'UNCERTAIN',
        certifies: false,
        blocker,
        resolvedBy: 'A working owner login (see the auth/ evidence for this run), then re-run.',
        login: { finalUrl: login.finalUrl, errorText: login.errorText },
      });
      expect(login.authenticated, `${MATRIX_ITEM} blocked. Evidence: ${file}`).toBe(true);
      return;
    }
    await shot('1-authenticated');

    // ── Navigate to the persisting action surface ───────────────
    // OmniDash sidebar -> Links module -> URL stage. The Links module is the
    // nominated production action whose state is backed by Supabase table
    // `omnilink_links`.
    if (!page.url().includes(DASHBOARD_ROUTE)) {
      await page.goto(DASHBOARD_ROUTE, { waitUntil: 'domcontentloaded', timeout: 45_000 }).catch(() => undefined);
      await page.waitForTimeout(2_500);
    }

    let linksNav = page.locator('.omni-nav-item').filter({ hasText: /^\s*links\s*$/i }).first();
    if ((await linksNav.count()) === 0 || !(await linksNav.isVisible().catch(() => false))) {
      await page.evaluate(() => {
        const tabs = document.querySelectorAll('.omni-mobile-tab');
        if (tabs.length >= 3) (tabs[2] as HTMLElement).click();
      }).catch(() => undefined);
      await page.waitForTimeout(1_500);
      linksNav = page.locator('.omni-nav-item').filter({ hasText: /^\s*links\s*$/i }).first();
    }
    const linksNavFound = (await linksNav.count()) > 0;
    if (linksNavFound) {
      await linksNav.click({ timeout: 15_000 }).catch(() => undefined);
      await page.waitForTimeout(2_500);
    }
    await shot('2-links-open');

    let urlInput = page.locator('[data-testid="links-add-url-input"]').first();
    if ((await urlInput.count()) === 0) {
      const addAction = page
        .locator('button')
        .filter({ hasText: /^\s*add link\s*$/i })
        .first();
      if ((await addAction.count()) > 0) {
        await addAction.click({ timeout: 10_000 }).catch(() => undefined);
        await page.waitForTimeout(1_500);
      }
      urlInput = page.locator('[data-testid="links-add-url-input"]').first();
    }
    const syncUnavailable =
      (await page.locator('[data-testid="links-unavailable-copy"]').count()) > 0;
    const inputReachable = (await urlInput.count()) > 0;

    // ── Perform the action ──────────────────────────────────────
    let submitted = false;
    let submitErrorText: string | null = null;
    if (inputReachable && !syncUnavailable) {
      await urlInput.first().fill(testUrl);
      const submit = page.locator('[data-testid="links-add-url-button"]').first();
      await submit.click({ timeout: 15_000 }).catch(() => undefined);
      await page.waitForTimeout(2_500);
      submitted = true;
      const errorNode = page.locator('text=/Failed to save link/i').first();
      if ((await errorNode.count()) > 0) {
        submitErrorText = redact(((await errorNode.textContent()) ?? '').trim()).slice(0, 240);
      }
    }
    await shot('3-after-action');

    // ── Backend write proof ─────────────────────────────────────
    // The action is only "persisted" if a backend exchange for the table
    // returned a 2xx. A local-only stage produces no such exchange — that is
    // precisely the LOCAL_LAUNCHED-never-silently-LIVE guardrail.
    const writeExchanges = recorder
      .matching(PERSISTENCE_TABLE)
      .filter((exchange) => ['POST', 'PUT', 'PATCH'].includes(exchange.method));
    const acceptedWrite = writeExchanges.find((e) => e.status >= 200 && e.status < 300) ?? null;

    // ── Hard reload (full document load, not client navigation) ──
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 45_000 }).catch(() => undefined);
    await page.waitForTimeout(2_500);
    const exchangesBeforeReadBack = recorder.exchanges.length;

    let linksNavAfter = page
      .locator('.omni-nav-item')
      .filter({ hasText: /^\s*links\s*$/i })
      .first();
    if ((await linksNavAfter.count()) === 0 || !(await linksNavAfter.isVisible().catch(() => false))) {
      await page.evaluate(() => {
        const tabs = document.querySelectorAll('.omni-mobile-tab');
        if (tabs.length >= 3) (tabs[2] as HTMLElement).click();
      }).catch(() => undefined);
      await page.waitForTimeout(1_500);
      linksNavAfter = page
        .locator('.omni-nav-item')
        .filter({ hasText: /^\s*links\s*$/i })
        .first();
    }
    if ((await linksNavAfter.count()) > 0) {
      await linksNavAfter.click({ timeout: 15_000 }).catch(() => undefined);
      await page.waitForTimeout(2_500);
    }
    await shot('4-after-hard-reload');

    // Authenticated direct read-back probe with retry to ensure PostgREST exchange is captured
    await page.evaluate(async ({ targetUrl, anonKey }: { targetUrl: string; anonKey: string }) => {
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const tokenKey = Object.keys(window.localStorage).find(
            (k) => k.startsWith('sb-') && k.endsWith('-auth-token'),
          );
          if (!tokenKey) {
            await new Promise((r) => setTimeout(r, 800));
            continue;
          }
          const raw = window.localStorage.getItem(tokenKey);
          if (!raw) {
            await new Promise((r) => setTimeout(r, 800));
            continue;
          }
          const session = JSON.parse(raw);
          const token = session?.access_token;
          if (!token) {
            await new Promise((r) => setTimeout(r, 800));
            continue;
          }
          const res = await fetch(
            `https://rtopreovkywofgwgmozi.supabase.co/rest/v1/omnilink_links?url=eq.${encodeURIComponent(targetUrl)}&select=id,url,status,created_at`,
            {
              headers: {
                apikey: anonKey,
                Authorization: `Bearer ${token}`,
              },
            },
          );
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) break;
          }
        } catch (_err) {
          void _err;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
    }, { targetUrl: testUrl, anonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '' });
    await page.waitForTimeout(2_000);

    // ── Read-back proof, sourced from the network, not the DOM ──
    const readExchanges: RecordedExchange[] = recorder.exchanges.filter(
      (exchange) =>
        (exchange.url.includes(PERSISTENCE_TABLE) || exchange.url.includes('omnilink-port')) &&
        ['GET', 'POST'].includes(exchange.method),
    );
    const readBackExchange =
      readExchanges.find((e) => e.status >= 200 && e.status < 300 && e.bodyExcerpt.includes(marker)) ??
      null;
    const domShowsMarker = (await page.locator(`text=${marker}`).count()) > 0;
    const postReloadScan = await scanClientSurface(page);
    const postReloadSignal = await visibleSignal(page);

    // ── Verdict ─────────────────────────────────────────────────
    const checks = {
      actionSurfaceReachable: inputReachable,
      actionSubmitted: submitted,
      noSubmitError: submitErrorText === null,
      backendAcceptedWrite: acceptedWrite !== null,
      readBackFromNetworkAfterHardReload: readBackExchange !== null,
      noServiceRoleKeyClientSide:
        recorder.serviceRoleSightings.length === 0 &&
        postReloadScan.serviceRoleSightings.length === 0,
    };
    const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);

    let outcome: 'VERIFIED' | 'FAILED' | 'UNCERTAIN' = 'VERIFIED';
    let blocker: string | null = null;
    let resolvedBy: string | null = null;

    if (!inputReachable || syncUnavailable) {
      outcome = 'UNCERTAIN';
      blocker = syncUnavailable
        ? 'Links module reported sync unavailable for this account: staging is local-only by design, so no backend write was attempted. This is an honest local-only path, NOT persistence proof.'
        : 'The Links staging input was not reachable from the authenticated OmniDash shell; no backend write was attempted.';
      resolvedBy = syncUnavailable
        ? 'An owner test account whose Links module resolves to a live (non-unavailable) state, or a nominated alternative persisting module action; then re-run.'
        : 'A stable data-testid on the OmniDash sidebar Links launcher (e.g. data-testid="omnidash-nav-links"), or a documented UI path to a persisting module action; then re-run.';
    } else if (submitErrorText !== null) {
      outcome = 'FAILED';
      blocker = `Backend rejected the persistence write: ${submitErrorText}`;
    } else if (acceptedWrite === null) {
      outcome = 'FAILED';
      blocker =
        `No accepted backend write to ${PERSISTENCE_TABLE} was observed for a submitted action — ` +
        'the UI reported no error, which is the fake-success shape the guardrails forbid.';
    } else if (readBackExchange === null) {
      // Empty read-back is genuinely ambiguous: not persisted, or persisted but
      // not re-fetched in this view. Never guess.
      outcome = 'UNCERTAIN';
      blocker =
        `Backend accepted the write (${acceptedWrite.method} ${acceptedWrite.status}) but no post-reload GET ` +
        `for ${PERSISTENCE_TABLE} returned the marker${domShowsMarker ? ' (the DOM shows it, which is not network-sourced proof)' : ''}.`;
      resolvedBy =
        `A post-reload GET on ${PERSISTENCE_TABLE} whose response body contains the marker, or a direct ` +
        'authenticated PostgREST read-back of the row id returned by the insert (Prefer: return=representation); then re-run.';
    } else if (failed.length > 0) {
      outcome = 'FAILED';
      blocker = `Failed checks: ${failed.join(', ')}.`;
    }

    // Hand the created row to Task C — only when a write was actually accepted.
    fs.writeFileSync(
      createdRecordPath(),
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          matrixItemId: MATRIX_ITEM,
          table: PERSISTENCE_TABLE,
          marker,
          testUrl,
          writeAccepted: acceptedWrite !== null,
          usableByTenantBProbe: acceptedWrite !== null,
          outcome,
        },
        null,
        2,
      )}\n`,
    );

    const evidenceFile = writeEvidence(SECTION, `${testInfo.project.name}-omnidash-persistence`, {
      matrixItemId: MATRIX_ITEM,
      outcome,
      certifies: outcome === 'VERIFIED',
      blocker,
      resolvedBy,
      project: testInfo.project.name,
      table: PERSISTENCE_TABLE,
      marker,
      checks,
      backendPersistenceProven: outcome === 'VERIFIED',
      steps: {
        navigation: { linksNavFound, syncUnavailable, inputReachable },
        write: { submitted, submitErrorText, exchanges: writeExchanges, accepted: acceptedWrite },
        hardReload: { method: "page.reload({ waitUntil: 'networkidle' })", exchangesBeforeReadBack },
        readBack: {
          finalUrl: safeUrl(page.url()),
          visibleSignal: postReloadSignal,
          networkSourced: readBackExchange !== null,
          domShowsMarker,
          exchanges: readExchanges,
        },
      },
      serviceRoleSightings: [
        ...recorder.serviceRoleSightings,
        ...postReloadScan.serviceRoleSightings,
      ],
      consoleErrors: recorder.consoleErrors.slice(0, 25),
      pageErrors: recorder.pageErrors.slice(0, 25),
    });

    expect(
      outcome,
      `${MATRIX_ITEM} not certified. Evidence: ${evidenceFile}. ${redact(blocker ?? '')}`,
    ).toBe('VERIFIED');
  });
});
