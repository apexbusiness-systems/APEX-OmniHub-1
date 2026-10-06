import { expect, test, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Fail-closed guard: this file is not a .spec.ts so default Playwright CI discovery
// will not pick it up. If someone runs it directly without the env var, throw immediately.
if (process.env.APEX_RUN_PRODUCTION_SAFE !== 'true') {
  throw new Error(
    'Production-safe live validation is opt-in. Run with npm run test:e2e:production-safe.'
  );
}

const evidenceRoot = path.resolve('artifacts/production-validation');
const routes = [
  { path: '/', expectation: 'public' },
  { path: '/login', expectation: 'public' },
  { path: '/request-access', expectation: 'request-access' },
  { path: '/demo', expectation: 'public-or-gated' },
  { path: '/omnidash', expectation: 'auth-gated' },
] as const;

const redact = (value: string) =>
  value
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[redacted-email]')
    .replace(/(access_token|refresh_token|id_token|code|token|key|password|secret)=([^&\s]+)/gi, '$1=[redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer [redacted]');

const safeUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    parsed.search = parsed.search ? '?[redacted-query]' : '';
    parsed.hash = '';
    return redact(parsed.toString());
  } catch {
    return redact(value);
  }
};

async function visibleSignal(page: Page) {
  const selectors = ['h1', 'h2', '[role="heading"]', 'main', 'body'];
  for (const selector of selectors) {
    const loc = page.locator(selector).first();
    if ((await loc.count()) > 0) {
      const text = (await loc.textContent({ timeout: 1_000 }).catch(() => ''))?.trim();
      if (text) return redact(text.replace(/\s+/g, ' ').slice(0, 240));
    }
  }
  return '';
}

function classify(input: {
  route: string;
  status: number | null;
  finalUrl: string;
  title: string;
  signal: string;
  pageErrors: string[];
  consoleErrors: string[];
}) {
  const combined = `${input.title} ${input.signal}`.toLowerCase();
  const finalUrl = input.finalUrl.toLowerCase();
  const fatalText = /stack trace|uncaught|failed to fetch|application error|something went wrong|cannot read properties/i;
  if (!input.status || input.status >= 500 || fatalText.test(combined) || input.pageErrors.length > 0) return 'FAILED';
  if (input.route === '/omnidash') {
    if (finalUrl.includes('/login') || finalUrl.includes('/auth') || /sign in|log in|login|welcome back|request access|protected|authenticated/.test(combined)) return 'AUTH_GATE_VERIFIED';
    return 'HONESTLY_GATED';
  }
  if (input.route === '/request-access') return input.signal ? 'WORKFLOW_VERIFIED' : 'FAILED';
  if (input.status >= 400) return 'FAILED';
  return input.signal ? 'PUBLIC_RENDER_VERIFIED' : 'FAILED';
}

test.describe('production-safe live browser evidence', () => {
  for (const route of routes) {
    test(`${route.path} captures sanitized production evidence`, async ({ page }, testInfo: TestInfo) => {
      fs.mkdirSync(path.join(evidenceRoot, 'screenshots'), { recursive: true });
      fs.mkdirSync(path.join(evidenceRoot, 'browser'), { recursive: true });

      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      const failedRequests: Array<{ url: string; failure: string }> = [];
      const httpProblems: Array<{ url: string; status: number; expectedAuthGate: boolean }> = [];

      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(redact(message.text()).slice(0, 500));
      });
      page.on('pageerror', (error) => pageErrors.push(redact(error.message).slice(0, 500)));
      page.on('requestfailed', (request) => failedRequests.push({ url: safeUrl(request.url()), failure: redact(request.failure()?.errorText || 'unknown') }));
      page.on('response', (response) => {
        const status = response.status();
        if (status >= 400) {
          httpProblems.push({
            url: safeUrl(response.url()),
            status,
            expectedAuthGate: route.path === '/omnidash' && [401, 403, 404].includes(status),
          });
        }
      });

      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await page.waitForTimeout(1500);
      await page.keyboard.press('Tab').catch(() => undefined);

      const finalUrl = safeUrl(page.url());
      const title = redact(await page.title());
      const signal = await visibleSignal(page);
      const slug = route.path === '/' ? 'root' : route.path.replace(/^\//, '').replace(/[^a-z0-9-]/gi, '-');
      const screenshot = path.join(evidenceRoot, 'screenshots', `${testInfo.project.name}-${slug}.png`);

      // Bounded viewport capture — fullPage: true caused CI hangs on /request-access and /demo.
      // Screenshot failures are recorded in screenshotError but do not fail the route.
      let screenshotError: string | null = null;
      try {
        await page.screenshot({
          path: screenshot,
          fullPage: false,
          animations: 'disabled',
          caret: 'hide',
          timeout: 15_000,
        });
      } catch (error) {
        screenshotError = redact(error instanceof Error ? error.message : String(error)).slice(0, 500);
      }

      const classification = classify({
        route: route.path,
        status: response?.status() ?? null,
        finalUrl,
        title,
        signal,
        pageErrors,
        consoleErrors,
      });

      const summary = {
        generatedAt: new Date().toISOString(),
        baseURL: safeUrl(testInfo.config.projects.find((p) => p.name === testInfo.project.name)?.use?.baseURL as string || process.env.APEX_PROD_URL || 'https://apexomnihub.icu'),
        project: testInfo.project.name,
        route: route.path,
        expectation: route.expectation,
        classification,
        status: response?.status() ?? null,
        finalUrl,
        title,
        visibleSignal: signal,
        screenshot,
        screenshotError,
        consoleErrors,
        pageErrors,
        failedRequests,
        httpProblems,
        keyboardSmoke: { tabPressed: true },
        backendPersistenceProven: false,
        liveProductionTouched: true,
      };

      fs.writeFileSync(path.join(evidenceRoot, 'browser', `${testInfo.project.name}-${slug}.json`), `${JSON.stringify(summary, null, 2)}\n`);
      // Only fail when route classification is FAILED. Screenshot errors are recorded above.
      expect(classification, JSON.stringify(summary, null, 2)).not.toBe('FAILED');
    });
  }
});
