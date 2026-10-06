import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { load as loadYaml } from 'js-yaml';

/**
 * Deploy-trigger gate: a workflow that can deploy to or change the production Supabase
 * project must never run on push, pull request or schedule, and must run in a reviewer-gated
 * GitHub Environment. Merging a pull request must never arm a production deploy.
 */
const WORKFLOWS_DIR = '.github/workflows';
const SUPABASE_DEPLOY_SECRETS = /\b(SUPABASE_ACCESS_TOKEN|SUPABASE_PROJECT_REF|SUPABASE_DB_PASSWORD)\b/;
const REMOTE_SUPABASE_COMMANDS = /supabase\s+(functions\s+deploy|db\s+push|migration\s+(repair|up)|link)\b/;

type Job = { environment?: string | { name?: string }; if?: string };
type Workflow = { on?: unknown; jobs?: Record<string, Job> };

function codeOnly(text: string): string {
  return text
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .map((line) => line.replace(/\s+#\s.*$/, ''))
    .join('\n');
}

function load(file: string) {
  const raw = readFileSync(join(WORKFLOWS_DIR, file), 'utf8');
  const doc = loadYaml(raw) as Workflow;
  // `on` parses to the string key "on" (YAML 1.2), but tolerate a boolean-coerced key.
  const on = (doc.on ?? (doc as unknown as Record<string, unknown>)['true']) as unknown;
  const triggers = typeof on === 'string' ? [on] : Object.keys((on ?? {}) as object);
  return { raw, code: codeOnly(raw), doc, triggers };
}

const files = readdirSync(WORKFLOWS_DIR).filter((f) => /\.ya?ml$/.test(f));
const gated = files.filter((f) => {
  const { code } = load(f);
  return SUPABASE_DEPLOY_SECRETS.test(code) || REMOTE_SUPABASE_COMMANDS.test(code);
});

function envName(job: Job): string | undefined {
  return typeof job.environment === 'string' ? job.environment : job.environment?.name;
}

describe('production Supabase deploy workflows are manual and reviewer-gated', () => {
  it('finds the deploy workflows this gate covers', () => {
    expect(gated).toEqual(
      expect.arrayContaining(['deploy-web3-functions.yml', 'deploy-production-cf-direct.yml']),
    );
  });

  it.each(gated)('%s runs only on workflow_dispatch', (file) => {
    expect(load(file).triggers).toEqual(['workflow_dispatch']);
  });

  it.each(gated)('%s has a job in a GitHub Environment', (file) => {
    const jobs = Object.values(load(file).doc.jobs ?? {});
    expect(jobs.some((job) => Boolean(envName(job)))).toBe(true);
  });
});

describe('deploy-web3-functions.yml', () => {
  const { code, doc, triggers } = load('deploy-web3-functions.yml');
  const job = Object.values(doc.jobs ?? {})[0];

  it('has no push, pull_request or schedule trigger', () => {
    expect(triggers).toEqual(['workflow_dispatch']);
  });

  it('runs in the production-db environment and only from main', () => {
    expect(Object.keys(doc.jobs ?? {})).toHaveLength(1);
    expect(envName(job)).toBe('production-db');
    expect(job.if).toContain("github.ref == 'refs/heads/main'");
  });

  it('never touches the database', () => {
    expect(code).not.toMatch(/db\s+push/);
    expect(code).not.toContain('--include-all');
    expect(code).not.toMatch(/migration\s+(repair|up)/);
    expect(code).not.toMatch(/supabase\s+link/);
    expect(code).not.toContain('SUPABASE_DB_PASSWORD');
  });

  it('deploys exactly the two allow-listed function sets to the configured project', () => {
    const sets = Object.fromEntries(
      [...code.matchAll(/^\s+([a-z0-9-]+)\)\n\s+functions="([^"]+)"/gm)].map((m) => [m[1], m[2].split(/\s+/)]),
    );
    expect(sets).toEqual({
      'web3-and-billing': [
        'web3-nonce',
        'web3-verify',
        'alchemy-webhook',
        'verify-nft',
        'platform-health',
        'omnilink-port',
        'create-billing-portal',
      ],
      'apex-agent': ['apex-agent'],
    });
    expect(code).toContain('supabase functions deploy "$fn" --project-ref "$SUPABASE_PROJECT_REF"');
    // An unknown target fails closed.
    expect(code).toMatch(/\*\)\n\s+echo "::error::Unknown deploy target[^\n]*\n\s+exit 1/);
  });

  it('selects the set with a choice input, never free text', () => {
    const inputs = (
      (doc.on as { workflow_dispatch?: { inputs?: Record<string, { type?: string; options?: string[] }> } })
        .workflow_dispatch?.inputs ?? {}
    );
    expect(inputs.target?.type).toBe('choice');
    expect(inputs.target?.options).toEqual(['web3-and-billing', 'apex-agent']);
    // The input reaches the script only through the environment.
    const uses = code.split('\n').filter((line) => line.includes('inputs.target'));
    expect(uses.map((line) => line.trim())).toEqual([
      'DEPLOY_TARGET: ${{ inputs.target }}',
      'DEPLOY_TARGET: ${{ inputs.target }}',
    ]);
  });

  it('does not interpolate the free-text reason into a shell script', () => {
    // The only place the input may appear is the env mapping; scripts read the variable.
    const uses = code.split('\n').filter((line) => line.includes('inputs.reason'));
    expect(uses).toHaveLength(1);
    expect(uses[0].trim()).toBe('DEPLOY_REASON: ${{ inputs.reason }}');
    expect(code).toContain('DEPLOY_REASON: ${{ inputs.reason }}');
    expect(code).toContain('${DEPLOY_REASON}');
  });
});

describe('deploy-mcp-gateway.yml', () => {
  const { code, doc, triggers } = load('deploy-mcp-gateway.yml');
  const job = Object.values(doc.jobs ?? {})[0];

  it('is manual only, in production-db, from main', () => {
    expect(triggers).toEqual(['workflow_dispatch']);
    expect(Object.keys(doc.jobs ?? {})).toHaveLength(1);
    expect(envName(job)).toBe('production-db');
    expect(job.if).toContain("github.ref == 'refs/heads/main'");
  });

  it('deploys only mcp-gateway and never touches the database', () => {
    const deploys = code.match(/supabase\s+functions\s+deploy\s+\S+/g) ?? [];
    expect(deploys).toEqual(['supabase functions deploy mcp-gateway']);
    expect(code).toContain('--project-ref "$SUPABASE_PROJECT_REF"');
    expect(code).not.toMatch(/db\s+push|migration\s+(repair|up)|--include-all|SUPABASE_DB_PASSWORD/);
  });

  it('passes the free-text reason through the environment only', () => {
    const uses = code.split('\n').filter((line) => line.includes('inputs.reason'));
    expect(uses).toHaveLength(1);
    expect(uses[0].trim()).toBe('DEPLOY_REASON: ${{ inputs.reason }}');
  });
});
