import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.APEX_PROD_URL || 'https://apexomnihub.icu';

// Minted once by scripts/ci/run-production-safe-validation.mjs and inherited by
// every worker, so one invocation produces exactly one evidence directory.
const runId = process.env.APEX_VALIDATION_RUN_ID || 'unpinned';

// Some validation environments reach the public internet only through an
// egress proxy. Chromium does not read HTTPS_PROXY on its own, so forward it
// explicitly when present; unset means direct connection, as before.
const proxyServer = process.env.APEX_VALIDATION_PROXY || process.env.HTTPS_PROXY || process.env.https_proxy;
const proxy = proxyServer ? { server: proxyServer, bypass: process.env.NO_PROXY || process.env.no_proxy } : undefined;

export default defineConfig({
  testDir: './tests/e2e-playwright',
  // Every live validation file uses the *.live.ts suffix so default Playwright
  // discovery (*.spec.ts) can never pick them up and hit production by accident.
  testMatch: [
    'production-safe.live.ts',
    'production-safe-negative-controls.live.ts',
    'production-safe-auth.live.ts',
    'production-safe-persistence.live.ts',
    'production-safe-rls.live.ts',
  ],
  fullyParallel: false,
  retries: 0,
  timeout: 90_000,
  reporter: [
    ['line'],
    ['json', { outputFile: `artifacts/production-validation/${runId}/results.json` }],
    // Retained for backwards compatibility with the pre-run-id evidence path.
    ['json', { outputFile: 'artifacts/production-validation/playwright-report.json' }],
  ],
  use: {
    baseURL,
    ...(proxy ? { proxy } : {}),
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    ignoreHTTPSErrors: false,
  },
  projects: [
    { name: 'prod-desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'prod-mobile-chromium', use: { ...devices['Pixel 7'], viewport: { width: 393, height: 851 } } },
  ],
});
