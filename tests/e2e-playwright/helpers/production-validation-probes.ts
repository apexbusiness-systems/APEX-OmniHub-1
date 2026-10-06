/**
 * production-validation-probes — browser-side probes for the live
 * production-safe validation harness.
 *
 * Everything here is read-mostly and redaction-first: probes report the
 * *existence*, *name* and *shape* of auth material, never its value.
 *
 * OWNED BY: APEX Business Systems Ltd.
 */

import { expect, type Page, type Response } from '@playwright/test';
import { redact, safeUrl } from './production-validation-evidence';

// ── Network recording ───────────────────────────────────────────

export interface RecordedExchange {
  readonly method: string;
  readonly url: string;
  readonly status: number;
  readonly resourceType: string;
  /** Redacted response body excerpt — bounded so evidence stays reviewable. */
  readonly bodyExcerpt: string;
  readonly bodyBytes: number;
}

export interface NetworkRecorder {
  readonly exchanges: RecordedExchange[];
  readonly consoleErrors: string[];
  readonly pageErrors: string[];
  readonly serviceRoleSightings: string[];
  /** Exchanges whose URL matches a substring, newest last. */
  matching(fragment: string): RecordedExchange[];
}

/** A Supabase service-role key is a JWT whose payload claims role=service_role. */
export function jwtClaimsRole(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const json = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(
      'utf8',
    );
    const claims = JSON.parse(json) as { role?: unknown };
    return typeof claims.role === 'string' ? claims.role : null;
  } catch {
    return null;
  }
}

/** Report *where* a service-role credential was seen. Never returns the value. */
export function findServiceRoleSightings(source: string, text: string): string[] {
  const sightings: string[] = [];
  const jwts = text.match(/\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\b/g) ?? [];
  for (const jwt of jwts) {
    if (jwtClaimsRole(jwt) === 'service_role') sightings.push(`${source}: service_role JWT present`);
  }
  if (/service[_-]?role[_-]?key/i.test(text.replace(/eyJ[A-Za-z0-9_.-]+/g, ''))) {
    sightings.push(`${source}: literal "service-role-key" string present`);
  }
  return sightings;
}

const RECORDABLE = new Set(['xhr', 'fetch', 'document']);

/**
 * Attach console/page-error/network listeners. Response bodies are read only
 * for XHR/fetch/document so we never buffer binary assets.
 */
export function attachNetworkRecorder(page: Page, bodyLimit = 1200): NetworkRecorder {
  const exchanges: RecordedExchange[] = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const serviceRoleSightings: string[] = [];

  page.on('console', (message) => {
    const text = message.text();
    serviceRoleSightings.push(...findServiceRoleSightings('console', text));
    if (message.type() === 'error') consoleErrors.push(redact(text).slice(0, 500));
  });
  page.on('pageerror', (error) => pageErrors.push(redact(error.message).slice(0, 500)));

  page.on('response', (response: Response) => {
    const request = response.request();
    const resourceType = request.resourceType();
    if (!RECORDABLE.has(resourceType)) return;
    void response
      .text()
      .then((body) => {
        serviceRoleSightings.push(
          ...findServiceRoleSightings(`response ${safeUrl(response.url())}`, body),
        );
        exchanges.push({
          method: request.method(),
          url: safeUrl(response.url()),
          status: response.status(),
          resourceType,
          bodyExcerpt: redact(body).slice(0, bodyLimit),
          bodyBytes: body.length,
        });
      })
      .catch(() => {
        exchanges.push({
          method: request.method(),
          url: safeUrl(response.url()),
          status: response.status(),
          resourceType,
          bodyExcerpt: '[body unavailable]',
          bodyBytes: 0,
        });
      });
  });

  return {
    exchanges,
    consoleErrors,
    pageErrors,
    serviceRoleSightings,
    matching: (fragment: string) => exchanges.filter((e) => e.url.includes(fragment)),
  };
}

// ── Client-surface credential scan ──────────────────────────────

export interface ClientSurfaceScan {
  /** Storage key NAMES only — e.g. sb-<ref>-auth-token. Never values. */
  readonly localStorageKeys: string[];
  readonly sessionStorageKeys: string[];
  readonly cookieNames: string[];
  /** Names of storage keys that look like a Supabase auth session artifact. */
  readonly sessionArtifactKeys: string[];
  readonly serviceRoleSightings: string[];
}

/**
 * Inspect the client surface for (a) the presence of a session artifact and
 * (b) any leaked service-role credential. Values are never returned.
 */
export async function scanClientSurface(page: Page): Promise<ClientSurfaceScan> {
  const raw = await page.evaluate(() => {
    const readKeys = (store: Storage) => {
      const keys: string[] = [];
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i);
        if (key) keys.push(key);
      }
      return keys;
    };
    const dump = (store: Storage) =>
      readKeys(store)
        .map((key) => store.getItem(key) ?? '')
        .join('\n');
    return {
      localStorageKeys: readKeys(window.localStorage),
      sessionStorageKeys: readKeys(window.sessionStorage),
      cookieNames: document.cookie
        .split(';')
        .map((part) => part.split('=')[0]?.trim())
        .filter((name): name is string => Boolean(name)),
      storageBlob: `${dump(window.localStorage)}\n${dump(window.sessionStorage)}`,
      html: document.documentElement.outerHTML,
    };
  });

  const sightings = [
    ...findServiceRoleSightings('browser storage', raw.storageBlob),
    ...findServiceRoleSightings('rendered document', raw.html),
  ];

  const isSessionArtifact = (key: string) =>
    /^sb-.*-auth-token/.test(key) || /supabase\.auth\.token/.test(key);

  return {
    localStorageKeys: raw.localStorageKeys,
    sessionStorageKeys: raw.sessionStorageKeys,
    cookieNames: raw.cookieNames,
    sessionArtifactKeys: [...raw.localStorageKeys, ...raw.sessionStorageKeys].filter(
      isSessionArtifact,
    ),
    serviceRoleSightings: sightings,
  };
}

// ── Auth flow primitives ────────────────────────────────────────

export interface LoginOutcome {
  readonly submitted: boolean;
  readonly finalUrl: string;
  readonly authenticated: boolean;
  readonly errorText: string | null;
  readonly sessionArtifactKeys: string[];
}

/**
 * Drive the real production login form. Credentials are typed with
 * `fill()` — they are never interpolated into a URL, a log line, or evidence.
 */
export async function loginWithPassword(
  page: Page,
  email: string,
  password: string,
): Promise<LoginOutcome> {
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 45_000 });

  const emailField = page.locator('#email, input[type="email"]').first();
  const passwordField = page.locator('#password, input[type="password"]').first();
  await expect(emailField).toBeVisible({ timeout: 20_000 });
  await emailField.fill(email);
  await passwordField.fill(password);

  const submit = page
    .locator('button[type="submit"]')
    .filter({ hasText: /sign in|log in|continue/i })
    .first();
  const submitFallback = page.locator('button[type="submit"]').first();
  const button = (await submit.count()) > 0 ? submit : submitFallback;

  await button.click();
  // Give the auth round-trip + client redirect a bounded window to settle.
  // Avoid networkidle because Supabase realtime long-polling prevents network idle state.
  await Promise.race([
    page.waitForURL((url) => !/\/(login|auth)\b/.test(url.pathname), {
      waitUntil: 'domcontentloaded',
      timeout: 15_000,
    }),
    page.waitForSelector('.form-error, [role="alert"]', { timeout: 15_000 }),
  ]).catch(() => undefined);
  await page.waitForTimeout(2_000);

  const scan = await scanClientSurface(page);
  const errorLocator = page.locator('.form-error, [role="alert"]').first();
  const errorText =
    (await errorLocator.count()) > 0
      ? redact(((await errorLocator.textContent()) ?? '').trim()).slice(0, 240)
      : null;

  return {
    submitted: true,
    finalUrl: safeUrl(page.url()),
    authenticated: scan.sessionArtifactKeys.length > 0 && !/\/(login|auth)\b/.test(page.url()),
    errorText,
    sessionArtifactKeys: scan.sessionArtifactKeys,
  };
}

/** Click the real sign-out affordance. Returns whether an affordance was found. */
export async function signOut(page: Page): Promise<boolean> {
  const candidates = [
    page.locator('[data-testid="omnidash-sign-out"]'),
    page.locator('[data-testid="omnidash-mobile-sign-out"]'),
    page.getByRole('button', { name: /sign out|log out|logout/i }),
    page.locator('button', { hasText: /sign out|log out|logout/i }),
  ];
  for (const candidate of candidates) {
    if ((await candidate.count()) > 0 && (await candidate.first().isVisible().catch(() => false))) {
      await candidate.first().click({ timeout: 10_000 }).catch(() => undefined);
      await Promise.race([
        page.waitForURL((url) => /\/(login|auth)\b/.test(url.pathname), {
          waitUntil: 'domcontentloaded',
          timeout: 10_000,
        }),
        page.waitForTimeout(2_000),
      ]).catch(() => undefined);
      return true;
    }
  }

  // Mobile drawer affordance: open "More" tab if sign-out is tucked inside mobile drawer
  const clickedMore = await page
    .evaluate(() => {
      const tabs = document.querySelectorAll('.omni-mobile-tab');
      if (tabs.length >= 5) {
        (tabs[tabs.length - 1] as HTMLElement).click();
        return true;
      }
      const tabByText = Array.from(document.querySelectorAll('button[role="tab"]')).find(
        (b) => /more/i.test(b.textContent || '') || /more/i.test(b.getAttribute('aria-label') || ''),
      ) as HTMLElement | undefined;
      if (tabByText) {
        tabByText.click();
        return true;
      }
      return false;
    })
    .catch(() => false);

  if (clickedMore) {
    await page.waitForTimeout(800);
    const clickedSignOut = await page
      .evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(
          (b) =>
            b.getAttribute('data-testid') === 'omnidash-mobile-sign-out' ||
            /sign out|log out/i.test(b.textContent || ''),
        );
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })
      .catch(() => false);

    if (clickedSignOut) {
      await Promise.race([
        page.waitForURL((url) => /\/(login|auth)\b/.test(url.pathname), {
          waitUntil: 'domcontentloaded',
          timeout: 10_000,
        }),
        page.waitForTimeout(2_000),
      ]).catch(() => undefined);
      return true;
    }
  }

  return false;
}

/** Visible heading/main-content signal, redacted and bounded. */
export async function visibleSignal(page: Page): Promise<string> {
  for (const selector of ['h1', 'h2', '[role="heading"]', 'main', 'body']) {
    const loc = page.locator(selector).first();
    if ((await loc.count()) > 0) {
      const text = (await loc.textContent({ timeout: 1_000 }).catch(() => ''))?.trim();
      if (text) return redact(text.replace(/\s+/g, ' ').slice(0, 240));
    }
  }
  return '';
}
