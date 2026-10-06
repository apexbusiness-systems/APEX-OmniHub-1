---
version: 1.0.0
last_audited: 2026-06-12
status: verified
---

<!-- APEX_DOC_STAMP: VERSION=v9.0 | LAST_UPDATED=2026-05-20 -->
# Repo Scope Context (Senior DevOps Prep)

> **Note:** Verified facts as of 2026-05-06 with confirmed build status.
> For agent-specific briefing, read `CLAUDE.md` at the repo root first.

_Last verified:_ 2026-05-06
_Repository:_ `APEX-OmniHub`

## Objective

Establish a practical, ops-focused map of the repository so the next engineering task can start with full architectural and operational context.

## High-Level Platform Context

From the root README and docs index, APEX OmniHub is organized as an enterprise AI orchestration platform with:

- A React/Vite frontend control plane (`src/`)
- Supabase edge and data plane (`supabase/functions`, `supabase/migrations`)
- A Python Temporal orchestrator (`orchestrator/`)
- Infra-as-code and runtime delivery layers (`terraform/`, `.github/workflows/`)
- Extensive validation layers (`tests/`, `sim/`, `scripts/`)

## Repository Topology (Ops-Relevant)

### Core runtime domains

- `src/` — Main UI application (OmniDash) and client-side feature domains
- `orchestrator/` — Temporal workflows, activities, policies, infra adapters (Python)
- `supabase/functions/` — serverless edge handlers (integration/orchestration entrypoints)
- `supabase/migrations/` — versioned schema + policy evolution
- `apps/` — additional app surfaces (`dashboard`, `omnihub-site`)

### Reliability/security/compliance support

- `tests/` — broad test suites (security, integration, e2e, stress, web3, etc.)
- `sim/` — chaos simulation harness and fixtures
- `security/` — security outputs/check artifacts
- `docs/` — architecture, runbooks, compliance, audits, readiness evidence

### Platform/infra automation

- `.github/workflows/` — CI/CD + security + readiness pipelines
- `scripts/` — CI, DR, security, guardian, omnilink, quality, zero-trust utilities
- `terraform/` — infra modules + environment definitions
- `android/`, `ios/` — mobile wrappers (Capacitor)

## Build/Test/Run Surface

**Package manager: `bun` (not npm/yarn for installs).** All install commands use `bun install`.
`npm` is used only for `npm audit` in CI security gates.

Primary package scripts indicate a polyglot operational model:

- Frontend quality gates: `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`
- E2E + smoke checks: Playwright (`bun run test:e2e`) + asset checks (`bun run test:assets`)
- Security/quality scans: `bun run secret:scan`, `npm audit --omit=dev --audit-level=high`, `bun run docs:check`
- Resilience: simulation modes (`bun run sim:*`) and worldwide wildcard test harness
- Python orchestrator CI path: `bun run lint:py`, `bun run test:py`, `bun run ci:py`
- Web3 path: Hardhat compile/test/deploy scripts

**Dev server runs on port 8080** (not 5173). Set in `vite.config.ts: server.port: 8080`.

## CI/CD Workflow Inventory

Workflow files in `.github/workflows/` (refreshed 2026-09-29, 23 files; `production-readiness.yml` is retired):

- `alert-guard-rail-violation.yml`
- `apex-governance.yml`
- `arise-propose.yml`
- `arise.yml`
- `cd-staging.yml`
- `chaos-simulation-ci.yml`
- `ci-runtime-gates.yml`
- `compliance.yml`
- `dependency-consolidation.yml`
- `deploy-mcp-gateway.yml`
- `deploy-omnihub-proof.yml`
- `deploy-production-cf-direct.yml`
- `deploy-web3-functions.yml`
- `integration.yml`
- `lighthouse.yml`
- `mobile-build-verify.yml`
- `nightly-evaluation.yml`
- `ops-doc-guard.yml`
- `orchestrator-ci.yml`
- `release.yml`
- `rsi-governance.yml`
- `secret-scanning.yml`
- `security-regression-guard.yml`

Deploy workflows (`deploy-web3-functions.yml`, `deploy-mcp-gateway.yml`) are `workflow_dispatch` only, run in the `production-db` environment and never run migrations; see `docs/APEX_AGENT_OPERATIONS.md` section 5.

## Codebase Composition Snapshot (Tracked Files)

Based on `git ls-files` extension distribution (refreshed 2026-09-29; the 2026-05-06 figures were 309 `.ts`, 180 `.tsx`, 268 `.md`, 75 `.py`, 40 `.sql`, 1198 total):

- TypeScript (`.ts`): 882
- React TSX (`.tsx`): 372
- Markdown docs (`.md`): 646
- Python (`.py`): 174
- SQL (`.sql`, forward and rollback): 128
- Total tracked files: 2878

Interpretation: this is documentation-heavy with substantial TypeScript frontend/backend glue and a meaningful Python orchestration subsystem.

## Operational Readiness Notes for Next Task

1. **Multiple deploy targets exist** (frontend, edge functions, orchestrator worker, mobile wrappers); task impact should be scoped by runtime boundary first.
2. **Policy/security are first-class** (zero-trust, secret scanning, security regression workflow), so changes likely need explicit security gate consideration.
3. **Resilience tooling is mature** (`sim/`, chaos CI, wildcard tests), enabling non-happy-path validation for infra/runtime changes.
4. **Cross-language coordination is required** for end-to-end features touching TypeScript + Python + SQL contracts.

## Recommended Pre-Task Checklist (DevOps Lens)

- Confirm the target execution boundary (UI, edge, orchestrator, infra, or shared contract).
- Select the minimal verification set (TS gates, Python gates, e2e, sim) based on blast radius.
- Verify required env dependencies (`.env.example`, orchestrator env, Supabase/Temporal requirements).
- Align any infra/config deltas with matching CI workflow coverage.
- Document rollback criteria if task affects orchestrator or migrations.

## Commands Used for This Scope Pass

```bash
pwd && rg --files -g 'AGENTS.md'
find .. -name AGENTS.md -print
ls -la
rg -n "^#" README.md docs -g '*.md' | head -n 120
cat package.json
find . -maxdepth 2 -type d | sed 's|^./||' | sort
sed -n '1,260p' README.md
sed -n '1,220p' orchestrator/README.md
sed -n '1,260p' docs/README.md
find .github/workflows -maxdepth 1 -type f -name '*.yml' -o -name '*.yaml' | sed 's|^./||' | sort
python - <<'PY' ... git ls-files extension count ... PY
cat Makefile
find . -maxdepth 1 -type d | sed 's|^./||' | sort
```
