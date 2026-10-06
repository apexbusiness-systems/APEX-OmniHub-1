#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const rootWrangler = resolve(ROOT, 'wrangler.toml');
const pkgPath = resolve(ROOT, 'package.json');
const distIndex = resolve(ROOT, 'dist/index.html');
const expectedBuildCommand = 'bun run build';
const expectedOutputDirectory = 'dist';
let failed = 0;

function check(label, condition, detail = '') {
  if (condition) console.log(`  ✓ ${label}`);
  else {
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
    failed += 1;
  }
}

console.log('=== verify:cloudflare-pages-contract ===');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

check('root wrangler.toml is absent', !existsSync(rootWrangler), 'Cloudflare Pages must not be configured from a root wrangler.toml');
check('package.json defines canonical build script', pkg.scripts?.build === 'vite build', 'expected scripts.build to remain vite build');
check('dist/index.html exists after build', existsSync(distIndex), 'run bun run build before this contract check');

console.log('\nExpected Cloudflare Pages dashboard settings:');
console.log('  root directory: repository root');
console.log(`  build command: ${expectedBuildCommand}`);
console.log(`  output directory: ${expectedOutputDirectory}`);
console.log('  root wrangler.toml: intentionally absent');

if (failed > 0) {
  console.error(`\n❌ verify:cloudflare-pages-contract FAILED — ${failed} contract check(s) failed`);
  process.exit(1);
}

console.log('\nverify:cloudflare-pages-contract PASSED');
