#!/usr/bin/env node
/**
 * check-client-secret-env — fail when client code references a secret-like
 * VITE_ env var (APEX-REV-2026-09 WP-09, F-15).
 *
 * Vite inlines VITE_* variables into the browser bundle, so a secret with that
 * prefix is public the moment it is set at build time. Scans client trees and
 * .env.example; tests and specs are excluded.
 *
 * Public keys such as VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY
 * do not match the pattern.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const SECRET_ENV_PATTERN =
  /VITE_[A-Z0-9_]*(?:SECRET|PRIVATE|SERVICE_ROLE|SERVICE_KEY|API_KEY|TOKEN)[A-Z0-9_]*/g;

const SCAN_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'tests', '__tests__', 'coverage']);
const SKIP_FILE = /\.(test|spec)\.[a-z]+$/;

function listFiles(dir, out) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(name)) listFiles(full, out);
    } else if (SCAN_EXTS.has(name.slice(name.lastIndexOf('.'))) && !SKIP_FILE.test(name)) {
      out.push(full);
    }
  }
  return out;
}

/** Client trees (src/, apps/<app>/src/, apps/<app>/dashboard/) plus .env.example. */
export function defaultTargets(repoRoot) {
  const targets = [join(repoRoot, 'src'), join(repoRoot, '.env.example')];
  const appsDir = join(repoRoot, 'apps');
  if (existsSync(appsDir)) {
    for (const app of readdirSync(appsDir)) {
      targets.push(join(appsDir, app, 'src'), join(appsDir, app, 'dashboard'));
    }
  }
  return targets.filter((p) => existsSync(p));
}

/** Returns `{ file, line, name }` for every secret-like VITE_ reference under `targets`. */
export function findClientSecretEnvRefs(targets, repoRoot) {
  const violations = [];
  for (const target of targets) {
    const files = statSync(target).isDirectory() ? listFiles(target, []) : [target];
    for (const file of files) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((text, i) => {
          for (const match of text.matchAll(SECRET_ENV_PATTERN)) {
            violations.push({ file: relative(repoRoot, file).replace(/\\/g, '/'), line: i + 1, name: match[0] });
          }
        });
    }
  }
  return violations;
}

function main() {
  const repoRoot = resolve(process.cwd());
  const violations = findClientSecretEnvRefs(defaultTargets(repoRoot), repoRoot);
  if (violations.length === 0) {
    console.log('[client-secret-env] PASS: no secret-like VITE_ env vars in client code.');
    return;
  }
  for (const v of violations) {
    console.error(`::error file=${v.file},line=${v.line}::${v.name} is inlined into the browser bundle. Move it server-side.`);
  }
  console.error(`[client-secret-env] FAIL: ${violations.length} secret-like VITE_ reference(s).`);
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
