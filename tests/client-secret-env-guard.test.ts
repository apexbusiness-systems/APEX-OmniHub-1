import { afterAll, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  defaultTargets,
  findClientSecretEnvRefs,
} from '../scripts/ci/check-client-secret-env.mjs';

// APEX-REV-2026-09 WP-09 (F-15): secret-like VITE_ vars must never appear in client code.
const fixtureRoot = mkdtempSync(join(tmpdir(), 'client-secret-env-'));
afterAll(() => rmSync(fixtureRoot, { recursive: true, force: true }));

function fixture(rel: string, content: string): void {
  const full = join(fixtureRoot, rel);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, content);
}

describe('check-client-secret-env guard', () => {
  it('passes on the real repository client trees', () => {
    const root = process.cwd();
    expect(findClientSecretEnvRefs(defaultTargets(root), root)).toEqual([]);
  });

  it('fails on secret-like VITE_ names in client code and .env.example', () => {
    fixture('src/leak.ts', "const k = import.meta.env.VITE_STRIPE_SECRET_KEY;\nconst t = env.VITE_GITHUB_TOKEN;\n");
    fixture('apps/site/dashboard/svc.tsx', "getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY');\n");
    fixture('.env.example', 'VITE_OPENAI_API_KEY=\n');
    const found = findClientSecretEnvRefs(defaultTargets(fixtureRoot), fixtureRoot);
    expect(found.map((v) => v.name).sort()).toEqual([
      'VITE_GITHUB_TOKEN',
      'VITE_OPENAI_API_KEY',
      'VITE_STRIPE_SECRET_KEY',
      'VITE_SUPABASE_SERVICE_ROLE_KEY',
    ]);
    expect(found.find((v) => v.name === 'VITE_GITHUB_TOKEN')).toMatchObject({ file: 'src/leak.ts', line: 2 });
  });

  it('allows public keys and ignores tests, specs and node_modules', () => {
    const root = mkdtempSync(join(tmpdir(), 'client-secret-env-clean-'));
    try {
      const write = (rel: string, content: string) => {
        mkdirSync(join(root, rel, '..'), { recursive: true });
        writeFileSync(join(root, rel), content);
      };
      write('src/ok.ts', 'import.meta.env.VITE_SUPABASE_ANON_KEY; import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;\n');
      write('src/a.test.ts', 'VITE_STRIPE_SECRET_KEY\n');
      write('src/b.spec.tsx', 'VITE_STRIPE_SECRET_KEY\n');
      write('src/tests/c.ts', 'VITE_STRIPE_SECRET_KEY\n');
      write('src/node_modules/d.js', 'VITE_STRIPE_SECRET_KEY\n');
      expect(findClientSecretEnvRefs(defaultTargets(root), root)).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
