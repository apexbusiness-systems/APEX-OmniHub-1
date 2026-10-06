---
version: 1.0.0
last_audited: 2026-09-29
status: verified
---

# Corrections

Store durable correction records here.

Each correction should capture:
- date
- original wrong assumption
- corrected state
- scope: local, project-wide, global, or user-style
- affected pages
- promotion decision: page only, directive, or user-pattern rule

## Entries

Numbered correction files in this directory (index — see each file for full detail):

- `001-migration-linter-preceding-line.md` (2026-05-26) — additive-migration allowlist comment must precede the line it exempts.
- `002-sonarqube-prng-hotspot.md` (2026-05-26) — `Math.random()` in mock/simulation code still trips SonarQube S2245; use a `crypto.getRandomValues`-backed helper.
- `003-sonar-coverage-migrations-exclusion.md` (2026-05-26) — SQL migrations need an explicit `sonar.coverage.exclusions` entry, not an automatic exemption.
- `004-omniboard-dual-surface-scoping.md` (2026-06-20, superseded by the entry below) — OmniBoard vs. Links surface ownership.
- `005-fabricated-dependency-audit-claim.md` (2026-07-21) — a fabricated "dependency audit fixed" entry shipped to `main` in PR #1646's `docs/APEX_AGENT_OPERATIONS.md`; `docs:check` only validates links/pointers, not claim truthfulness.
- `006-claim-integrity-gate-scope-overstatement.md` (2026-07-22) — a new CI gate's documented coverage overstated what its matcher logic actually checks; caught and corrected pre-push on PR #1655.
- `007-ops-log-9-41-nonexistent-script-and-corruption.md` (2026-09-29) — ops-log §9.41 named a script and file that never existed; the harness doc contradicted the release matrix; text corruption (mojibake, lost letters) repaired.
- `2026-05-28-verify-gate-authenticity.md` (2026-05-28) — verify gates must contain real logic, not fake-pass stubs; the AG2-era `verify:ci-integrity` was itself a fake-pass script.

### 2026-05-29 — Single-agent assumption + stale HEAD (global, permanent)

- **Original wrong assumption:** Omni-Recall framed the runtime as Claude/GPT-only and the
  root `CLAUDE.md` pinned `main @ a54bd7c (2026-05-20)`, implying Claude is the sole
  committer and the repo had not advanced.
- **Corrected state:** This repo is **multi-agent** — Google Jules, Google Antigravity,
  OpenAI Codex, and Dependabot also commit. Verify HEAD with `git log` before trusting
  `CLAUDE.md` commit/date facts. Verified HEAD `d1e83b0` on 2026-05-29.
- **Scope:** global.
- **Affected pages:** root `CLAUDE.md`, `memory/omni-recall/CLAUDE.md`, master blueprint,
  `quality-bar.md`, `state/checkpoints/current-status.md`, core directives.
- **Promotion decision:** directive (multi-agent block added to omni-recall/CLAUDE.md and core directives).
- **Permanent:** yes.

### 2026-06-10 — OmniBoard "integration-only" scoping (project-wide, permanent)

- **Original wrong assumption:** "OmniBoard is strictly for application integration and is never client-facing."
- **Corrected state:** OmniBoard is the ONE and ONLY user-facing UI endpoint for third-party application integration and onboarding. The conversational modal (Left Sidebar Widget → `OmniBoardWizard.tsx`, typed prompt input) guides the user through app connections, producing a verified Connection Spec for the `apex-universal-sync-orchestrator`. Integration-pipeline skills scope to their function
  boundary; product descriptions present both surfaces.
- **Scope:** project-wide.
- **Affected pages:** `.claude/skills/apex-universal-sync-orchestrator/`,
  `docs/platform/OMNIBOARD.md`, `docs/skill-forge-implementation.md`,
  `docs/architecture/CANONICAL_TRUTH.md` (fact 19), `docs/README.md`.
- **Promotion decision:** canonical fact + ledger entry
  (`004-omniboard-dual-surface-scoping.md` has been superseded by the 2026-06-20 Canonical Widget Rescue).
- **Permanent:** yes.
