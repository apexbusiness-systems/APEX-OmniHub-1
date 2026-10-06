#!/usr/bin/env node
/**
 * run-production-safe-validation — entrypoint for
 * `npm run test:e2e:production-safe`.
 *
 * Responsibilities (deliberately small):
 *  1. Mint ONE run id so every Playwright worker writes into the same
 *     artifacts/production-validation/<runId>/ directory. Workers are separate
 *     processes and re-evaluate the config, so the id must be inherited via
 *     the environment rather than computed per worker.
 *  2. Load owner-supplied credentials from the untracked
 *     .env.production-validation, if present. Values are never printed.
 *  3. Forward every extra CLI argument to Playwright unchanged.
 *  4. Write a run manifest recording which credential variables were present
 *     (names only) so a later reader can tell a credential-less run from a
 *     genuine certification run.
 *
 * OWNED BY: APEX Business Systems Ltd.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const CREDENTIAL_VARS = [
  'APEX_TEST_USER_EMAIL',
  'APEX_TEST_USER_PASSWORD',
  'APEX_TENANT_B_EMAIL',
  'APEX_TENANT_B_PASSWORD',
];

/** Minimal KEY=VALUE reader. Does not print, echo, or export values anywhere. */
function loadCredentialFile(file) {
  if (!fs.existsSync(file)) return [];
  const loaded = [];
  for (const rawLine of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    if (!/^[A-Z][A-Z0-9_]*$/.test(key)) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Real environment always wins over the file.
    if (!process.env[key]) {
      process.env[key] = value;
      loaded.push(key);
    }
  }
  return loaded;
}

const runId =
  process.env.APEX_VALIDATION_RUN_ID ||
  new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
process.env.APEX_VALIDATION_RUN_ID = runId;
process.env.APEX_RUN_PRODUCTION_SAFE = 'true';

const loadedFromFile = loadCredentialFile(path.resolve('.env.production-validation'));

const runDir = path.resolve('artifacts/production-validation', runId);
fs.mkdirSync(runDir, { recursive: true });

const presentCredentialVars = CREDENTIAL_VARS.filter((name) => Boolean(process.env[name]?.trim()));
const missingCredentialVars = CREDENTIAL_VARS.filter((name) => !process.env[name]?.trim());

const manifest = {
  runId,
  startedAt: new Date().toISOString(),
  baseUrl: process.env.APEX_PROD_URL || 'https://apexomnihub.icu',
  credentialSource: loadedFromFile.length > 0 ? '.env.production-validation' : 'process environment',
  // Names only — values are never recorded.
  presentCredentialVars,
  missingCredentialVars,
  certificationCapable: missingCredentialVars.length === 0,
  playwrightArgs: process.argv.slice(2),
};
fs.writeFileSync(path.join(runDir, 'run-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`production-safe validation run: ${runId}`);
console.log(`  evidence: artifacts/production-validation/${runId}/`);
console.log(
  missingCredentialVars.length === 0
    ? '  credentials: all required variables present'
    : `  credentials: MISSING ${missingCredentialVars.join(', ')} — authenticated items cannot be certified`,
);

const req = createRequire(import.meta.url);
const playwrightCli = req.resolve('@playwright/test/cli');
const result = spawnSync(
  process.execPath,
  [playwrightCli, 'test', '-c', 'playwright.production-safe.config.ts', ...process.argv.slice(2)],
  { stdio: 'inherit', env: process.env },
);

const manifestFinal = {
  ...manifest,
  finishedAt: new Date().toISOString(),
  playwrightExitCode: result.status ?? 1,
};
fs.writeFileSync(
  path.join(runDir, 'run-manifest.json'),
  `${JSON.stringify(manifestFinal, null, 2)}\n`,
);

process.exit(result.status ?? 1);
