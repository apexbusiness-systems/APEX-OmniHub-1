> CI validates release readiness. Production certification is manual and owner-approved only.

---
version: 2.1.0
last_audited: 2026-09-29
status: verified
---

> CI validates release readiness. Production certification is manual and owner-approved only.

# Documentation Release Index

> Current repo-truth index refreshed **2026-09-29** (documentation sync after the September 2026 revenue-contract work: new `CURRENT_PLATFORM_STATE_2026_09_29.md` and `.understand-anything/CANONICAL_STATE_2026-09-29.md`; counts re-verified against `main` @ `6c62fdb8`; production facts read-only). Previous refresh: 2026-07-21. Use this file as the onboarding entry point for maps, READMEs, status records, audits, and runbooks. Historical docs remain useful as evidence, but current-state claims defer to the canonical files listed below and to `CURRENT_PLATFORM_STATE_2026_09_29.md`.

## Current Repo Facts Verified in This Pass (2026-09-29)


> Repository counts directly git-verified this session against the working tree (commands in `CURRENT_PLATFORM_STATE_2026_09_29.md` §8). Production facts (Cloudflare Pages settings, deployed edge functions, applied migrations) were read on 2026-09-29 through read-only APIs. Older live-health rows marked *carried forward* were **not** re-verified in this pass.

| Fact | Current repo evidence |
|---|---|
| Audited baseline | `main` @ `6c62fdb8` (2026-09-29, merge of PR #25 audit-log write path, part B). Since the previous index: PRs #14–#16, #18–#19, #21–#25 and the two September validation commits. See `CANONICAL_STATE_2026-09-29.md` §1. |
| Documentation-sync branch | Branch off `main` @ `6c62fdb8`, published as its own PR (one PR at a time) |
| Source files under `src/` | **322** TypeScript/TSX (234 `.ts` + 88 `.tsx`) — unchanged since 2026-07-21 |
| GitHub workflow files | **23** files in `.github/workflows/` (adds `deploy-mcp-gateway.yml`; `deploy-web3-functions.yml` is manual and reviewer-gated) |
| Release/package versions | Root `package.json` declares **`1.8.3`**; app package `apps/omnihub-site/package.json` declares `1.3.10` |
| Release-cut model | **Manual / owner-driven** — `changeset version` → `chore: version packages`; CI validates, `compliance.yml` attaches SBOM evidence. CI does not certify or decide releases. No release cut since `v1.8.3` (2026-08-23). See `CURRENT_PLATFORM_STATE_2026_09_29.md` |
| SQL migrations | **116** forward `.sql` files + **10** rollback scripts = **126** total — git-verified 2026-09-29. Production has applied migrations through `20260928000000`; four 2026-09-28 migrations and the two audit-log migrations (`20260929000000`, `20260929000100`) are merged but pending owner application |
| Edge function dirs | **35** (34 function dirs + `_shared`) — git-verified. **29** of the 34 are deployed; `mcp-proxy`, `notify-access-request`, `omnibridge-control`, `physiomni-action`, `physiomni-ingest` are not; 6 stale functions are deployed that are not in the repo (read 2026-09-29) |
| Custom hooks (`src/`) | **23** (`use*.ts*` in `src/`) |
| Python orchestrator files | **149** tracked (excl. `__pycache__`); the hosted service is suspended (2026-09-28 probe) |
| Module action gating | **Module-keyed capability map** (`moduleActionCapabilities.ts`, `moduleKey + actionId`) — PR #1441; unsupported actions fail-closed, never call `trigger-workflow` |
| Canonical package manager | npm for CI (`package-lock.json` canonical); bun optional for local dev (`bun.lock` committed, pinned `bun@1.3.14`) |
| RSI mode | `policy/rsi-policy.yaml` declares `mode: live`; `.github/workflows/rsi-governance.yml` is present |
| Integration harness CI | **FIXED** — `integration.yml` playwright install hang resolved (2026-06-25); `--with-deps` + browser cache + timeout added |
| APEX Agent (carried forward) | **LIVE / demo-ready** — verified end-to-end 2026-06-19; traces `61ce8dce`, `861d9f0c`, `da6e7fe5` completed |
| `omni_policies` (carried forward) | Provisioned 2026-06-19 — 7 tailored policies active |
| Ops-doc CI guard | `scripts/ci/check-ops-doc-drift.mjs` + `.github/workflows/ops-doc-guard.yml` active on all PRs to `main` |
| Shadow deployment slot | `apex-omnihub-shadow.pages.dev` provisioned 2026-05-20; GitHub Environment: `production-shadow`; production deployments and branch previews are off (2026-09-29) |
| Agent destructive-action guard | `scripts/ci/guard-agent-destructive-actions.mjs` + `.githooks/pre-commit.d/30-destructive-action-guard.sh` — deployed PR #1485; exemptions aligned with `check-release-certification-docs.mjs` (owner-approved/, templates/, CHANGELOG.md) |
| Release validation boundary | `docs/release/release-validation-matrix.json` — 19 of 20 items `VERIFIED` (auth, persistence and multi-tenant RLS promoted 2026-09-04/05), 1 `HONESTLY_GATED`; no items cover the September changes, which are `VERIFIED-IN-CODE` |
| Web go-live | Cloudflare Pages project `apex-omnihub` builds from `main` with automatic production deployments enabled: every merge to `main` goes live (read 2026-09-29) |
| Production deploy rule | Production edge functions deploy only from CI on `main`, by manual dispatch in the `production-db` environment (required reviewer); migrations are applied by the owner, in order, and only what is on `main` |

## Documentation Authority Order

0. `memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_09_29.md` for the latest head assessment, verified counts, production state and open owner items, with `.understand-anything/CANONICAL_STATE_2026-09-29.md` for merged work packages and finding closure. (All prior `CURRENT_PLATFORM_STATE_*.md` are historical.)
1. `docs/release/release-validation-matrix.json` for current release evidence boundaries and production-certification gaps.
2. `docs/architecture/ARCHITECTURE_CANONICAL_MAP.md` and `docs/architecture/CANONICAL_TRUTH.md` for current topology.
3. `docs/architecture/CANONICAL_TRUTH_MATRIX.md` for claim labels, simulation disclaimers, and portability status terms.
4. `docs/architecture/DOC_RECONCILIATION_MATRIX.md` for which legacy docs remain active, historical, or deprecated.
5. Dated audit reports for point-in-time evidence only; do not treat older audit dates as newer production truth.

## Anti-Drift Rules for Agents and Developers

- Re-verify live files before editing; do not force stale snapshot findings onto a safely diverged tree.
- Keep new operational instructions linked from `docs/README.md` and this index.
- When changing workflows, update the matching status/runbook docs and branch-protection guidance in the same PR.
- When changing runtime topology, update the canonical architecture map before updating historical reports.
- Label simulation, dry-run, sandbox, and mock evidence explicitly; do not promote it to live production proof.
- Do not create new shared-library roots; follow `docs/architecture/LIB_DIRECTORY_POLICY.md`.

## Canonical start points

- `docs/CURRENT_PLATFORM_STATE_2026_09_29.md` _(current — supersedes 2026-07-16 and all prior snapshots)_
- `docs/CURRENT_PLATFORM_STATE_2026_07_16.md` _(historical — 2026-07-16 snapshot)_
- `docs/CURRENT_PLATFORM_STATE_2026_07_04.md` _(historical — 2026-07-04 snapshot)_
- `docs/CURRENT_PLATFORM_STATE_2026_06_25.md` _(historical — 2026-06-25 snapshot)_
- `docs/CURRENT_PLATFORM_STATE_2026_06_24.md` _(historical — 2026-06-24 snapshot)_
- `docs/CURRENT_PLATFORM_STATE_2026_06_23.md` _(historical — 2026-06-23 snapshot)_
- `docs/CURRENT_PLATFORM_STATE_2026_06_22.md` _(historical — 2026-06-22 snapshot)_
- `docs/CURRENT_PLATFORM_STATE_2026_06_21.md` _(historical — 2026-06-21 snapshot)_
- `docs/CURRENT_PLATFORM_STATE_2026_06_20.md` _(historical — 2026-06-20 snapshot)_
- `docs/CURRENT_PLATFORM_STATE_2026_06_14.md` _(historical — 2026-06-14 snapshot)_
- `docs/CURRENT_PLATFORM_STATE_2026_06_06.md` _(historical — 2026-06-06 snapshot)_
- `README.md`
- `docs/README.md`
- `docs/architecture/ARCHITECTURE_CANONICAL_MAP.md`
- `docs/architecture/CANONICAL_TRUTH.md`
- `docs/architecture/CANONICAL_TRUTH_MATRIX.md`
- `docs/release/release-validation-matrix.json`
- `docs/project-status/APEX_RELEASE_READINESS_REPORT_v1.6.1.md` _(historical release-readiness point-in-time report — created 2026-05-20)_
- `docs/architecture/DOC_RECONCILIATION_MATRIX.md`
- `docs/APEX_AGENT_OPERATIONS.md` _(APEX Agent anti-drift operations reference — added 2026-06-19)_

## Current maps

- `docs/architecture/ARCHITECTURE_CANONICAL_MAP.md`
- `docs/architecture/BOUNDED_CONTEXT_MAP.md`

## Current README files

- `.changeset/README.md`
- `.claude/skills/apex-skill-forge-v9-claude/README.md`
- `.claude/skills/apex-skill-forge-v9-universal/README.md`
- `.claude/skills/one-pass-debug-skill/one-pass-debug/README.md`
- `.cursor/superpowers/README.md`
- `README.md`
- `apex-resilience/README.md`
- `docs/README.md`
- `docs/compliance/sbom/README.md`
- `docs/rsi/README.md`
- `docs/testing/README.md`
- `integration-harness/README.md`
- `ios/App/CapApp-SPM/README.md`
- `local-agents/README.md`
- `omega/README.md`
- `orchestrator/README.md`
- `sandbox/README.md`
- `scripts/debug/README.md`
- `scripts/dev/README.md`
- `sim/README.md`
- `src/lib/database/README.md`
- `src/lib/storage/README.md`
- `src/lib/web3/README.md`
- `terraform/README.md`

## Status and release documents

- `docs/project-status/APEX_RELEASE_READINESS_REPORT_v1.6.0.md` _(status update addendum added 2026-05-20)_
- `docs/project-status/APEX_RELEASE_READINESS_REPORT_v1.6.1.md` _(NEW — created 2026-05-20; current onboarding entry point alongside release-validation-matrix.json)_
- `docs/project-status/CI_STATUS_POLICY.md` _(updated 2026-07-04)_
- `docs/release/release-validation-matrix.json` _(current release evidence boundary — repo matrix generated 2026-06-26; documentation pointers refreshed 2026-07-04)_
- `docs/release/SHADOW_DEPLOYMENT_BLOCKERS.md` _(B-1/B-3 resolved — updated 2026-05-20)_
- `docs/releases/RELEASE_NOTES_v1.6.0.md`

## Audit documents

Current audits (in `docs/audits/`):

- `docs/audits/release-gate-audit-2026-07-01.md` — **full-build release GATE audit at `845fced`: GATE PASS** (28 gates locally + 31/31 CI checks on PR #1550; environmental-failure triage; tech-debt register)
- `docs/audits/omnidash-surface-alignment-glass-2026-06-30.md`
- `docs/audits/omnidash-p0-remediation-2026-06-28.md`
- `docs/audits/omnidash-systemic-error-catalog-2026-06-28.md`
- `docs/audits/documentation-drift-assessment-2026-06-26.md`
- `docs/audits/production-audit-2026-06-26.md`

Legacy audits (17 files, relocated to `memory/omni-recall/archive/docs/audits/` — historical evidence only):

- `ANNOTATED_PR_TRIAGE_2026_05_06.md`, `AOID_RELEASE_READINESS_REPORT_4-4-2026.md`, `APEX_RELEASE_READINESS_REPORT.md`, `ARMAGEDDON_TEST_SUITE_REPORT.md`, `DOCUMENTATION_AUDIT_2026-05-15.md`, `FULL_CODE_AUDIT_AND_VALUATION_2026_03_06.md`, `M-04_OMNIHUB_19_POINT_AUDIT_2026-05-06.md`, `OMNIDASH_BUILD_AUDIT_2026_03_21.md`, `PRODUCTION_CERTIFICATION_EVIDENCE_2026-05-13.md`, `PRODUCTION_CERTIFICATION_PREFLIGHT_2026-05-13.md`, `RUNTIME_REMEDIATION_CALL_GRAPH.md`, `RUNTIME_REMEDIATION_RESULTS.md`, `SUPABASE_SECURITY_AUDIT_2026_05_04.md`, `THIRD_PARTY_CODE_AUDIT_2026_03_07.md`, `THIRD_PARTY_CODE_AUDIT_2026_03_08.md`, `THIRD_PARTY_CODE_AUDIT_2026_03_09.md`, `VOICE_FORTRESS_TELEMETRY_AUDIT.md`
- `docs/DRIFT_AUDIT_2026_05_12.md`
- `docs/DRIFT_REMEDIATION_REPORT_2026_05_12.md`
- `DRIFT_MATRIX.md`

## Runbooks and operating procedures

- `docs/archive/legacy-runbooks/MIGRATION_RUNBOOK_legacy.md`
- `docs/archive/legacy-runbooks/OPS_RUNBOOK_legacy_2026-01-25.md`
- `docs/guides/DR_RUNBOOK.md`
- `docs/guides/NATIVE_PUSH_SETUP.md`
- `docs/guides/NFT_VERIFICATION_RUNBOOK.md`
- `docs/guides/WEB3_VERIFICATION_RUNBOOK.md`
- `docs/guides/admin-secret-setup.md`
- `docs/infrastructure/MIGRATION_RUNBOOK.md`
- `docs/ops/INCIDENT_RESPONSE.md`
- `docs/ops/OPEN_PR_GOVERNANCE_2026-05-13.md`
- `docs/ops/OPERATIONAL_EXCELLENCE.md`
- `docs/ops/OPS_RUNBOOK.md`
- `docs/ops/OPS_RUNBOOKS_CI_GUARDRAILS.md`
- `docs/ops/OPS_RUNBOOK_v1.3.8.md`
- `docs/ops/PR_TRIAGE.md`
- `docs/ops/adaptive-nightly-eval.md`
- `docs/ops/omnidash-asset-rca.md`
- `docs/ops/repo-scope-context.md`
- `docs/sim/RUNBOOK.md`

## Full `docs/` Directory Coverage

- `docs/` — 24 Markdown file(s): `AOID.md`, `DOCUMENTATION_RELEASE_INDEX.md`, `DRIFT_AUDIT_2026_05_12.md`, `DRIFT_REMEDIATION_REPORT_2026_05_12.md`, `README.md`, `csp-policy.md`, `sbbl-omnihub-integration-readiness-2026-05-09.md`, `skill-forge-implementation.md`, `CURRENT_PLATFORM_STATE_2026_06_14.md` through `CURRENT_PLATFORM_STATE_2026_09_29.md` snapshots (11 files; latest/current: `CURRENT_PLATFORM_STATE_2026_09_29.md`; prior dated snapshots are historical), and the 5 `CURRENT_ARISE_*` A.R.I.S.E. reports.
- `docs/api/` — 2 Markdown file(s): `API_EXTENSION_GUIDE.md`, `EDGE_FUNCTIONS_REFERENCE.md`
- `docs/architecture/` — 12 Markdown file(s): `ARCHITECTURE_CANONICAL_MAP.md`, `BOUNDED_CONTEXT_MAP.md`, `CANONICAL_TRUTH.md`, `CANONICAL_TRUTH_MATRIX.md`, `DETAILED_SYSTEM_DESIGN.md`, `DOC_RECONCILIATION_MATRIX.md`, `EXECUTIVE_ARCHITECTURE_SUMMARY.md`, `GENERAL_TECH_SPECS.md`, `LIB_DIRECTORY_POLICY.md`, `MAN_MODE_WORKFLOW_DIAGRAMS.md`, `OMNILINK_PORTABILITY_AND_SRE_STRATEGY.md`, `frontend-map.md`
- `docs/archive/legacy-runbooks/` — 4 Markdown file(s): `CI_RUNTIME_GATES_legacy.md`, `MIGRATION_RUNBOOK_legacy.md`, `OPS_RUNBOOK_legacy_2026-01-25.md`, `PRODUCTION_DEPLOYMENT_GUIDE_legacy.md` _(pre-existing legacy archive — not modified in 2026-05-20 pass)_
- `docs/audits/` — 6 Markdown file(s): `release-gate-audit-2026-07-01.md`, `omnidash-surface-alignment-glass-2026-06-30.md`, `omnidash-p0-remediation-2026-06-28.md`, `omnidash-systemic-error-catalog-2026-06-28.md`, `documentation-drift-assessment-2026-06-26.md`, `production-audit-2026-06-26.md` (17 legacy audits relocated to `memory/omni-recall/archive/docs/audits/`)
- `docs/capabilities/` — 6 Markdown file(s): `fortress-protocol.md`, `maestro.md`, `man-mode.md`, `omniport.md`, `orchestrator.md`, `tri-force-protocol.md`
- `docs/ci/` — 1 Markdown file(s): `CHAOS_CI_FIX.md`
- `docs/compliance/` — 9 Markdown file(s): `DATA_RETENTION_POLICY.md`, `EVIDENCE_CHECKLIST.md`, `GDPR_COMPLIANCE.md`, `GDPR_WORKFLOWS.md`, `OMNILINK_HYBRID_CERTIFICATION.md`, `PRIVACY_POLICY.md`, `SOC2_READINESS.md`, `TERMS_OF_SERVICE.md`, `THIRD_PARTY_NOTICES.md`
- `docs/compliance/sbom/` — 1 Markdown file(s): `README.md`
- `docs/extensibility/` — 1 Markdown file(s): `PLUGIN_ARCHITECTURE.md`
- `docs/guides/` — 5 Markdown file(s): `DR_RUNBOOK.md`, `NATIVE_PUSH_SETUP.md`, `NFT_VERIFICATION_RUNBOOK.md`, `WEB3_VERIFICATION_RUNBOOK.md`, `admin-secret-setup.md`
- `docs/infrastructure/` — 19 Markdown file(s): `BACKUP_VERIFICATION.md`, `BLOCKCHAIN_CONFIG.md`, `BLOCKCHAIN_DEPLOYMENT_CHECKLIST.md`, `CI_RUNTIME_GATES.md`, `CLOUD_AGNOSTIC_ARCHITECTURE.md`, `COST_OPTIMIZATION.md`, `DEMO_MODE.md`, `DISASTER_RECOVERY_PLAN.md`, `DOPPLER_IMPLEMENTATION_GUIDE.md`, `EMERGENCY_CONTROLS_USAGE.md`, `MIGRATION_NOTES.md`, `MIGRATION_RUNBOOK.md`, `OBSERVABILITY_STACK_SETUP.md`, `PATH_A_ENHANCED_SERVERLESS.md`, `PATH_B_CONTAINERIZED_MULTICLOUD.md`, `PORTABILITY_MATRIX.md`, `PRODUCTION_DEPLOYMENT_GUIDE.md`, `SRE_PACKAGE.md`, `SUPABASE_SETUP.md`
- `docs/integration/` — 2 Markdown file(s): `sbbl-hq-v1.6.0-patch.md`, `sbbl-omnihub-validation-2026-05-11.md`
- `docs/knowledge/` — 3 Markdown file(s): `DEVELOPER_OPERATING_MODEL.md`, `OMNIDEV_MANIFESTO.md`, `SYSTEM_KNOWLEDGE_BASE.md`
- `docs/knowledge/references/` — 8 Markdown file(s): `cloud.md`, `databases.md`, `frameworks.md`, `languages.md`, `observability.md`, `scale.md`, `security.md`, `testing.md`
- `docs/onboarding/` — 2 Markdown file(s): `BRANCH_PROTECTION.md`, `DEVELOPER_ONBOARDING.md`
- `docs/ops/` — 10 Markdown file(s): `INCIDENT_RESPONSE.md`, `OPEN_PR_GOVERNANCE_2026-05-13.md`, `OPERATIONAL_EXCELLENCE.md`, `OPS_RUNBOOK.md`, `OPS_RUNBOOKS_CI_GUARDRAILS.md`, `OPS_RUNBOOK_v1.3.8.md`, `PR_TRIAGE.md`, `adaptive-nightly-eval.md`, `omnidash-asset-rca.md`, `repo-scope-context.md`
- `docs/platform/` — 12 Markdown file(s): `CONNECTOR_KIT.md`, `OMNIBOARD.md`, `OMNIDASH.md`, `OMNIEVAL.md`, `OMNIHUB_PROTOCOL_CONFORMANCE.md`, `OMNILINK_MANIFESTO_LITE.md`, `OMNILINK_MOBILE_PWA.md`, `OMNILINK_PORT_DISCIPLINE.md`, `OMNIPOLICY.md`, `OMNIPORT_API_REFERENCE.md`, `OMNISENTRY.md`, `OMNITRACE.md`
- `docs/project-status/` — Markdown status files include `APEX_RELEASE_READINESS_REPORT_v1.6.0.md`, `APEX_RELEASE_READINESS_REPORT_v1.6.1.md`, and `CI_STATUS_POLICY.md`; current release evidence matrix lives at root `docs/release/release-validation-matrix.json`
- `docs/quality/` — 1 Markdown file(s): `QUALITY_ASSURANCE_FRAMEWORK.md`
- `docs/release/` — 1 Markdown file(s): `SHADOW_DEPLOYMENT_BLOCKERS.md`
- `docs/releases/` — 1 Markdown file(s): `RELEASE_NOTES_v1.6.0.md`
- `docs/rsi/` — 2 Markdown file(s): `BRANCH_PROTECTION_REQUIRED.md`, `README.md`
- `docs/rsi/proposals/` — 2 Markdown file(s): `attestation-verification.md`, `github-admin-setup.md`
- `docs/runtime/` — 1 Markdown file(s): `ENTERPRISE_CONTROL_PLANE.md`
- `docs/scalability/` — 1 Markdown file(s): `SCALABILITY_ARCHITECTURE.md`
- `docs/security/` — 11 Markdown file(s): `DEPENDABOT_MAJOR_UPGRADE_REVIEW_2026-05-13.md`, `ENV_FILE_EXPOSURE_ADVISORY.md`, `SECRETS_INVENTORY_AND_ROTATION.md`, `SECRETS_MANAGER_SETUP.md`, `SECRET_SCANNING.md`, `SECURITY_ADVISORIES.md`, `SECURITY_HARDENING_CHECKLIST.md`, `dependency-scanning.md`, `device-registry.md`, `prompt-defense-tuning.md`, `zero-trust-baseline.md`
- `docs/sim/` — 9 Markdown file(s): `ARCHITECTURE.md`, `CHAOS_SIMULATION_DELIVERY.md`, `CHAOTIC_CLIENT_SIMULATION_REPORT.md`, `CHAOTIC_CLIENT_STORY.md`, `INVENTORY.md`, `RESULTS_REPORT.md`, `RUNBOOK.md`, `SANDBOX_TEST_RESULTS_TEMPLATE.md`, `TEST_EXECUTION_REPORT.md`
- `docs/testing/` — 4 Markdown file(s): `ARMAGEDDON_LIVE_VALIDATION_RESULTS_2026_05_08.md`, `E2E_TEST_RESULTS.md`, `README.md`, `worldwide-wildcard-tests.md`
- `docs/valuation/` — 1 Markdown file(s): `PLATFORM_VALUATION_BRIEF.md`

## 2026-06-21 Platform-State Documentation Sync (PR #1441 widget rescue + repo-truth sync)

Full repo-truth documentation sync performed against `main` @ `966d695f` (PR #1441, merged this session). Repository counts were re-verified directly; live infrastructure health was carried forward from the 2026-06-19 verification (not re-checked — no live credentials used).

| File | Change |
|---|---|
| `docs/CURRENT_PLATFORM_STATE_2026_06_21.md` | **NEW** — supersedes 2026-06-20 snapshot; PR #1441 behavior record, verified repo counts (with verification commands), corrects the 06-20 `0020ba6b`/#1439 conflation, labels carried-forward infra |
| `docs/APEX_AGENT_OPERATIONS.md` | §9.1 added (2026-06-21) — records the read-free, no-op `omnilink-port` Links resolver contract change |
| `README.md` | Stats snapshot → 2026-06-21 (migrations 90→94, hooks 35→38, test files 346); HEAD/repo-history note → `966d695f`/#1441; Action Gating description → module-keyed capability map; platform-state links → 2026-06-21 |
| `memory/omni-recall/docs/DOCUMENTATION_RELEASE_INDEX.md` | This file — facts table, authority order, start points, and `docs/` coverage updated to the 2026-06-21 snapshot |
| `memory/omni-recall/docs/README.md` | Platform snapshot pointer + dates → 2026-06-21 |
| `memory/omni-recall/docs/architecture/CANONICAL_TRUTH.md` | Header → `main` @ `966d695f` / v1.7.1; Source-of-Truth statement **21** added (module-keyed capability map, honest Links resolver, OmniBoard wizard hardening); conflict-resolution pointer → 2026-06-21 |
| `memory/omni-recall/start-here.md` | Last Verified Session → 2026-06-21 / `966d695f` / PR #1441 |
| `memory/omni-recall/state/checkpoints/current-status.md` | Appended 2026-06-21 session block (PR #1441 corrective commit + docs sync) |
| `docs/release/release-validation-matrix.json` | 2026-06-21 addendum added — HEAD `966d695f`, #1439/#1441 merges, verified repo facts; verdict **unchanged** (`NOT_VALIDATED_NO_RELEASE_CUT`, no release cut) |
| `memory/omni-recall/docs/project-status/CI_STATUS_POLICY.md` | Current CI State → HEAD `966d695f` (#1441 merged 2026-06-21); #1438/#1439/#1441 rows added (merge = green signal under branch protection; tallies only where API-verified); workflow registry re-stamped 2026-06-21 |
| `CLAUDE.md` (root) | `last_audited` → 2026-06-21 (core protocols re-verified accurate; no content drift) |
| `orchestrator/README.md` | Production-runtime note added (points to canonical ops doc; flags semantic cache disabled in prod + Temporal Cloud); `last_audited` → 2026-06-21 |

### Note on scope (anti-drift)

This pass updates **living** documents only (entry points, indexes, current-status, canonical truth) and adds **one new dated snapshot**. Dated point-in-time artifacts (audits, reports, prior `CURRENT_PLATFORM_STATE_*` snapshots, checkpoints) were **left intact** — editing a dated historical record would itself create drift; corrections to them are recorded forward in the current snapshot instead.

---

## 2026-06-20 Platform-State Documentation Sync (APEX Agent Restoration)

Full drift audit performed against `main` @ `6f859ec8` (PR #1436). PR #1435 (`4bbd3e5b`, APEX Agent restoration) and PR #1436 (`6f859ec8`, OmniDash modal contracts) both merged 2026-06-19 and CI verified fully green via the GitHub check-runs API (#1435: 43 success / 3 skipped / 0 failed; #1436: 46 success / 3 skipped / 0 failed). APEX Agent confirmed LIVE.

| File | Change |
|---|---|
| `docs/CURRENT_PLATFORM_STATE_2026_06_20.md` | **NEW** — supersedes 2026-06-14 snapshot; full restoration event record, repo counts, CI state |
| `docs/APEX_AGENT_OPERATIONS.md` | **NEW** — canonical anti-drift operations reference for APEX Agent (service inventory, env contract, DB objects, runbook, migration-baseline rule) |
| `docs/operations/APEX_AGENT_RUNBOOK.md` | **NEW** — full production runbook (architecture, components, env vars, deploy, smoke test, incident response, logs, secrets, migration-baseline §11) |
| `docs/operations/APEX_AGENT_RESTORATION_EVIDENCE.md` | **NEW** — restoration evidence, trace IDs, migration-baseline documentation |
| `scripts/ci/check-ops-doc-drift.mjs` | **NEW** — deterministic guard: fails PRs that change runtime-contract paths without updating `docs/APEX_AGENT_OPERATIONS.md` |
| `.github/workflows/ops-doc-guard.yml` | **NEW** — CI workflow wiring the ops-doc drift guard on all PRs to `main` |
| `.github/pull_request_template.md` | Updated — wording changed from "LAW — required" to "CI-enforced" with workflow pointer |
| `orchestrator/tests/test_tool_validation.py` | Updated — `respond_to_user` added to canonical tool set; alias resolution test added |
| `orchestrator/tests/test_tools_extended.py` | Updated — stale `RuntimeError` test replaced with `test_check_semantic_cache_disabled_returns_none` (disabled cache returns `None`) |
| `README.md` | Stats snapshot updated to 2026-06-20 counts; canonical state link updated to 2026-06-20 doc; release line updated to `1.7.1` |
| `memory/omni-recall/docs/DOCUMENTATION_RELEASE_INDEX.md` | This file — canonical start point updated to 2026-06-20 snapshot; new ops docs added |

### APEX Agent restoration summary (2026-06-19)

Full end-to-end verified: OmniSlate → Cloudflare Pages → Supabase `apex-agent` → Render `apex-orchestrator-api` → Temporal Cloud → Render `apex-orchestrator-worker` → `agent_runs` terminal → SSE `completed` → UI answer. Traces `61ce8dce`, `861d9f0c`, `da6e7fe5` completed with real LLM answers. `omni_policies` provisioned with 7 tailored governance policies.

### Migration history baseline (2026-06-19)

Production had live schema objects while `schema_migrations` showed 0 applied. All 89 migrations baselined as applied without re-running SQL. `omni_policies` provisioned same day. Repo now holds 90 migration files.

---

## 2026-06-06 Platform-State Documentation Sync

Full OMEGA SCAN audit performed against `main` @ `c8d753c5`. All local quality gates verified green.

| File | Change |
|---|---|
| `docs/CURRENT_PLATFORM_STATE_2026_06_06.md` | **NEW** — supersedes 2026-06-02 snapshot; includes 2026-06-06 gate results, repo counts, OmniDash real-data status table, and drift resolutions |
| `docs/release/release-validation-matrix.json` | 2026-06-06 addendum added; verdict updated to `NOT_VALIDATED_NO_RELEASE_CUT`; gate audit updated to 2,561 tests; hono CVE advisory added; path-to-VALIDATED step 6 marked DONE |
| `docs/release/SHADOW_DEPLOYMENT_BLOCKERS.md` | B-2 status updated: `chore: version packages` merged; CI execution is the final remaining step |
| `docs/DOCUMENTATION_RELEASE_INDEX.md` | This file — canonical start point updated to 2026-06-06 snapshot |
| `README.md` | Stats snapshot updated to 2026-06-06 counts; canonical map link updated |
| `next-action.md` | Updated: highest-impact next action is triggering `release.yml` on main |

### Certification status (as of 2026-06-06)

| Blocker | Status |
|---|---|
| B-1 | RESOLVED (2026-05-20) |
| B-2 | `chore: version packages` MERGED (2026-06-05) — CI release run pending |
| B-3 | RESOLVED (2026-05-20) |

---

## 2026-06-01 Platform-State Documentation Sync

| File | Change |
|---|---|
|  `docs/CURRENT_PLATFORM_STATE_2026_06_06.md` | New current branch/head assessment, git-history summary, repo counts, and drift guardrails |
| `README.md` | Updated repo statistics, docs audit date, and current-state link |
| `docs/architecture/*` | Reconciled architecture maps/truth matrix with PR #1274 and PR #1309 state |
| `docs/platform/OMNIDASH.md` | Updated from feature-flag-era wording to always-on post-auth OmniDash surface |
| `memory/omni-recall/state/checkpoints/2026-06-01-platform-doc-sync.md` | Added durable recall checkpoint for future agents |

## 2026-05-20 Documentation Audit Pass

Documents created, modified, or archived in this audit pass:

### Created
| File | Notes |
|---|---|
| `docs/project-status/APEX_RELEASE_READINESS_REPORT_v1.6.1.md` | New release readiness report for v1.6.1 |

### Modified
| File | Change Summary |
|---|---|
| `docs/architecture/ARCHITECTURE_CANONICAL_MAP.md` | `omega/` and `orchestrator/` disambiguation added |
| `CLAUDE.md` | `omega/` and `orchestrator/` disambiguation added |
| `vitest.config.ts` | Coverage thresholds raised (branches 60→63, north-star 75%) |
| `.changeset/shadow-slot-coverage-docs.md` | v1.6.1 changeset |
| `docs/release/release-validation-matrix.json` | B-1 RESOLVED, B-3 RESOLVED |
| `docs/release/SHADOW_DEPLOYMENT_BLOCKERS.md` | B-1/B-3 resolved |
| `DRIFT_MATRIX.md` | 2026-05-20 entry added |
| `docs/project-status/APEX_RELEASE_READINESS_REPORT_v1.6.0.md` | Status update addendum added |
| `docs/project-status/CI_STATUS_POLICY.md` | Updated |
| `docs/testing/README.md` | Coverage thresholds updated |
| `docs/architecture/CANONICAL_TRUTH.md` | Updated |
| `docs/architecture/EXECUTIVE_ARCHITECTURE_SUMMARY.md` | Updated |
| `docs/architecture/GENERAL_TECH_SPECS.md` | Updated |
| `docs/architecture/DETAILED_SYSTEM_DESIGN.md` | Updated |
| `docs/onboarding/DEVELOPER_ONBOARDING.md` | pnpm fix, package manager fix, Node/Python version fix |
| `README.md` | Node requirement fix |
| `CONTRIBUTING.md` | Package manager policy updated |
| `docs/api/API_EXTENSION_GUIDE.md` | Placeholder URL notice added |
| `docs/extensibility/PLUGIN_ARCHITECTURE.md` | Coming Soon → Planned, implementation status added |
| `docs/api/EDGE_FUNCTIONS_REFERENCE.md` | Updated |

### Permanently Deleted
| File | Reason |
|---|---|
| `docs/project-status/APEX_ECOSYSTEM_STATUS.md` | v1.4.1 snapshot, 71 days stale — superseded by release-validation-matrix.json |
| `docs/project-status/PRODUCTION_STATUS.md` | v1.5.1 snapshot, 56 days stale — superseded by release-validation-matrix.json |
| `docs/infrastructure/DEPLOYMENT_ROLLOUT_PLAN.md` | 8-week phased rollout from 2026-03-01 — all phases elapsed; Vercel-centric |
| `docs/infrastructure/PRODUCTION_ROLLOUT_PLAN.md` | Duplicate phased rollout — superseded by PRODUCTION_DEPLOYMENT_GUIDE.md |
| `docs/infrastructure/CICD_PIPELINE_DESIGN.md` | Design-phase planning doc predating live workflows — superseded by CI_RUNTIME_GATES.md |
| `docs/project-status/PRODUCTION_STATUS.md` | Superseded by release-validation-matrix.json |
| `docs/project-status/APEX_ECOSYSTEM_STATUS.md` | Superseded by APEX_RELEASE_READINESS_REPORT_v1.6.1.md |
| `docs/infrastructure/DEPLOYMENT_ROLLOUT_PLAN.md` | Superseded by current deployment guides |
| `docs/infrastructure/PRODUCTION_ROLLOUT_PLAN.md` | Superseded by current deployment guides |
| `docs/infrastructure/CICD_PIPELINE_DESIGN.md` | Superseded by CI_RUNTIME_GATES.md and workflow YAML |

### Certification status (as of 2026-05-20)
| Blocker | Status |
|---|---|
| B-1 | RESOLVED |
| B-2 | PENDING |
| B-3 | RESOLVED |

### Deployment topology addition
- Shadow deployment slot: `apex-omnihub-shadow.pages.dev` (provisioned 2026-05-20)
- GitHub Environment: `production-shadow` (created 2026-05-20)

---

## Verification Commands for This Index

```bash
bun run docs:check
python3 - <<'PY'
from pathlib import Path
print(sum(1 for _ in Path("docs").rglob("*.md")))
print(sum(1 for _ in Path(".github/workflows").glob("*.yml")) + sum(1 for _ in Path(".github/workflows").glob("*.yaml")))
PY
```

---

## 2026-06-23 Platform-State Documentation Sync (Release-Rescue Audit + OmniSentry Full Wiring)

Full release-rescue audit performed against `main` @ `5870a8ec` (PR #1476, "Rebrand SkillForge to OmniSkills"). OmniSentry end-to-end wiring completed. All CI gates passing locally.

| File | Change |
|---|---|
| `memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_06_23.md` | **NEW** — full platform state snapshot; supersedes 2026-06-22 snapshot |
| `apps/omnihub-site/dashboard/components/OmniSentryWidget.tsx` | Full rewrite — all 5 lib capabilities wired (`initializeOmniSentry`, `shutdownOmniSentry`, `getHealthStatus`, `flushOfflineErrors`, `withResilience`) |
| `apps/omnihub-site/src/components/OmniSentryPanel.tsx` | Full rewrite — same 5 capabilities + expanded sections for offline queue + circuit probe |
| `tests/omnidash/omni-sentry-widget.spec.tsx` | **NEW** — 18-test smoke suite covering full widget render path |
| `scripts/ci/verify-claim-hygiene.mjs` | Patched — false-positive suppression for comments, `notes:` fields, WebAuthn params |
| `scripts/ci/ci-utils.mjs` | **NEW** — shared `walkFiles()` utility |
| `scripts/ci/check-omniskills-rebrand.mjs` | **NEW** — OmniSkills rebrand enforcement guard |
| `tests/ci/claim-hygiene-fixtures.test.mjs` | **NEW** — 5 fixture tests |
| `tests/ci/omniskills-rebrand-fixtures.test.mjs` | **NEW** — 6 fixture tests |
| `apps/omnihub-site/src/pages/Launch/SkillForge.tsx` | OmniSkills rebrand (h1 + toast) |
| `apps/omnihub-site/src/App.tsx` | Route title → `"OmniSkills"` |
| `memory/omni-recall/state/checkpoints/current-status.md` | 2026-06-23 session block appended |
| `memory/omni-recall/docs/architecture/CANONICAL_TRUTH.md` | Statement 22 added (OmniSkills rebrand, claim hygiene, OmniSentry full wiring) |
| `README.md` | HEAD / version / gate status synced to 2026-06-23 |

### Canonical start point at that time
`memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_06_23.md` (historical; superseded by 2026-07-04)

---

## 2026-06-25 Doc Sync — Integration Harness CI Fix + Count Corrections

Full repo-truth documentation sync performed against `main` @ `4c0d481` (PR #1488) and dev branch `claude/kind-feynman-h5gcbs` HEAD `6074e0c`. All counts directly git-verified.

| File | Change |
|---|---|
| `.github/workflows/integration.yml` | **FIXED** — playwright install hang: added `actions/cache@v4` for `~/.cache/ms-playwright`, switched to `playwright install --with-deps chromium`, added `timeout-minutes: 10`; YAML validated |
| `README.md` | v1.3.2→v1.3.3; last_audited 2026-06-24→2026-06-25; removed broken `production-readiness.yml` badge; workflow count 23→20; edge fn dirs 36→33; repo layout counts corrected; repo-history note updated to PR #1487/#1488; CI table: removed `sonarqube-analysis` (gone), fixed `guardrail-alert`→`alert-guard-rail-violation`, added `integration`, `security-regression-guard`, `orchestrator-ci`; removed `lovable-healthcheck` (dir gone) |
| `memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_06_25.md` | **NEW** — full platform state snapshot; supersedes 2026-06-24 |
| `memory/omni-recall/docs/DOCUMENTATION_RELEASE_INDEX.md` | v1.6.0→v1.7.0; this file — facts table, authority order, start points updated to 2026-06-25 |
| `memory/omni-recall/start-here.md` | v1.3.0→v1.3.1; 2026-06-25 session block appended |
| `memory/omni-recall/docs/architecture/CANONICAL_TRUTH.md` | Header updated to `main` @ `4c0d481`; Statement 24 added (integration harness CI fix, count corrections) |
| `memory/omni-recall/CLAUDE.md` | Audit line updated to 2026-06-25 |
| `.understand-anything/graph-meta.json` | Timestamp updated to 2026-06-25T01:00:00Z |
| `CLAUDE.md` (root) | **Skill routing updated** — `apex-dev` skill superseded; `apex-boost-claude`, `apex-master-debug-claude`, and `omnidev-apex-pro-1.0.0` are now the canonical skills |

### Count corrections (2026-06-24 → 2026-06-25, all git-verified)

| Metric | Previous (2026-06-24) | Current (2026-06-25) | Reason |
|---|---|---|---|
| CI/CD workflows | 23 | **20** | `dependency-review.yml`, `production-readiness.yml`, `security-guards.yml` removed in PRs #1487/#1488 |
| Edge function dirs | 36 | **33** | 3 dirs removed (git-verified against live tree) |
| All other counts | unchanged | unchanged | src 328, tsx 94, hooks 23, migrations 102 |

### Canonical start point at that time

`memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_06_25.md` (historical; superseded by 2026-07-04)

---

## 2026-06-24 Session 2 Doc Sync (PR #1485 — Certification Owner Approval + Agent Guardrails)

Full repo-truth documentation sync performed against branch `fix/release-certification-owner-approval` HEAD `d5d2684e`. Repository counts directly git-verified.

| File | Change |
|---|---|
| `README.md` | Stats snapshot → 2026-06-24 (src: 328, tsx: 94, edge fns: 36, migrations: 100, hooks: 23); repo-history note → PR #1485 (owner-approval certification) |
| `memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_06_24.md` | v1.0.0 → v1.1.0; PR #1485 session block appended with full change table + verified repo stats |
| `memory/omni-recall/docs/DOCUMENTATION_RELEASE_INDEX.md` | v1.4.0 → v1.5.0; facts table → 2026-06-24 verified counts; authority order + start points → 2026-06-24 current; 06-24 sync section added |
| `memory/omni-recall/start-here.md` | PR #1485 session block appended |
| `.understand-anything/` | Audited \u2014 `graph-meta.json` rebuilt 2026-06-24T03:39Z (auto-generated, no manual edits needed); `graph-features.mjs` is correct as-is (static tour copy with legacy node counts is acceptable for the visualization tool) |

### PR #1485 summary

- **Deleted** stale committed evidence artifact (triggered banned-phrase scanner + certification CI gate failure)
- **Replaced** automated release certification with explicit owner-approval workflow (`release-certification.yml`)
- **Deployed** `scripts/ci/guard-agent-destructive-actions.mjs` — proactive scanner for hallucinated source-file injections, banned phrases, unauthorized governance mutations
- **Added** `.githooks/pre-commit.d/30-destructive-action-guard.sh` pre-commit gate
- **Exempted** guard scripts from claim-hygiene scanner (false-positive suppression for pattern literals in test strings)
- **Fixed** IDE warnings: `OmniBoardWizard.tsx` JSX, `omniboard-wizard.spec.tsx` + `ui-surface-integrity.test.tsx` `window` → `globalThis`, `src/lib/supabase/client.ts` `typeof` simplification
- **CI law:** `CI validates. Owner certifies.` — reaffirmed in all canonical docs

### Canonical start point at that time

`memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_06_24.md` (historical; superseded by 2026-07-04)

---

## 2026-06-23 Commercial Realness Doc Sync (Stripe fail-closed + Gateway fix + apex-support skill audit)

Batch 2 of the PR #1477 fix session. Three code files changed; six doc files updated.

| File | Change |
|---|---|
| `memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_06_23.md` | Batch 2 section appended — Stripe fail-closed, gateway env fix, OmniSupportWidget audit, apex-support skill audit, PR #1477 final commit state |
| `memory/omni-recall/state/checkpoints/current-status.md` | 2026-06-23 late session block appended |
| `memory/omni-recall/docs/architecture/CANONICAL_TRUTH.md` | Statement 23 added — Stripe fail-closed, gateway env var, OmniSupportWidget wiring, OmniSentry sessionStorage correction |
| `memory/omni-recall/docs/api/EDGE_FUNCTIONS_REFERENCE.md` | `create-checkout` entry expanded — fail-closed behaviour, HTTP 503 error code, env var guard documented |
| `memory/omni-recall/docs/platform/OMNISENTRY.md` | Corrected `localStorage` → `sessionStorage` (NS-M-008) in feature table |
| `README.md` | Branch, PR, and gateway fix noted |

### Code files changed (Batch 2, commit `1fa8870e`)

| File | Change |
|---|---|
| `supabase/functions/create-checkout/index.ts` | Removed fake `price_123456789` fallback; removed empty-key Stripe client; added HTTP 503 `BILLING_NOT_CONFIGURED` fail-closed guard |
| `src/lib/realtime/ApexRealtimeGateway.ts` | `process.env.VITE_ORCHESTRATOR_BASE_URL` → `import.meta.env.VITE_ORCHESTRATOR_URL` |
| `src/components/global/OmniSupportWidget.tsx` | Removed `console.warn` on successful connect path |

### Current canonical start point
`memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_07_16.md` (2026-07-16 tech debt closeout documentation anti-drift sync is the latest state)


## 2026-07-16 Documentation Sync — Tech Debt Closeout Audit

Full repo-truth documentation sync performed against the working tree after the layout overlays merge (PR #1640) and during the tech debt closeout audits (PR #1642). Counts were re-verified against the active git tree on the `feat/omniboard-any-app-onboarding` branch.

| File | Change |
|---|---|
| `docs/debt-closeout/PR1641-LOCKED-FILES.txt` | **NEW** — locked files list for active open PR #1641 |
| `docs/debt-closeout/OMNIBOARD-TRUTH.md` | **NEW** — absolute repo-relative paths map for OmniBoard integrations registry, ConnectorKit UI, and backend Edge APIs |
| `docs/debt-closeout/VIEWPORT-TRUTH.md` | **NEW** — breakpoint mapping between active 3-tier layout and requested 5-tier responsive layout contract |
| `apps/omnihub-site/implementation_plan.md` | **NEW** — approved implementation plan and conflict report |
| `memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_07_16.md` | Updated baseline commit, added Section 6 layout and audits record |
| `memory/omni-recall/docs/DOCUMENTATION_RELEASE_INDEX.md` | This file — facts table, authority pointers, and sync records updated to 2026-07-16 |

### Current count corrections (2026-07-16, repo-verified)

| Metric | Current | Evidence command |
|---|---:|---|
| Workflow files | 22 | `find .github/workflows -maxdepth 1 -type f` |
| `src` TypeScript/TSX files | 321 (234 `.ts` + 87 `.tsx`) | `find src -type f -name '*.ts'` / `*.tsx` |
| Supabase function dirs | 35 (34 functions + `_shared`) | `find supabase/functions -mindepth 1 -maxdepth 1 -type d` |
| SQL migrations | 106 (102 forward + 4 rollback) | `find supabase/migrations -type f -name '*.sql'` |
| Spec/test source files | 388 | `find tests e2e sim apps orchestrator packages ...` |

---

## 2026-07-17 Documentation Sync — PR #1641 & PR #1642 Post-Merge

Full repo-truth documentation sync performed after PR #1641 (OmniBoard Integration Runtime) and PR #1642 (Tech Debt Closeout Audits) were squash-merged into `main`. Counts re-verified directly against the git tree. Local gate runs completed on branch `docs/followup-omniboard-runtime-canon`.

| File | Change |
|---|---|
| `README.md` | `version: 1.3.6`→`1.3.7`; `last_audited: 2026-07-16`→`2026-07-17`; HEAD note → `5c991065`; migration count `106`→`108`; tsx count `87`→`88`, ts `234`→`233`; canonical state link → `CANONICAL_STATE_2026-07-17.md` |
| `.understand-anything/CANONICAL_STATE_2026-07-17.md` | **NEW** — authoritative post-PR #1641 and PR #1642 state snapshot |
| `.understand-anything/CANONICAL_STATE_2026-07-16.md` | Section 3 — PR #1641 and PR #1642 updated from `(Open)` to `(Merged)` with commit SHAs |
| `memory/omni-recall/start-here.md` | 2026-07-17 session block appended (post-merge validation results + repo counts) |
| `memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_07_16.md` | Section 6 heading and PR #1641/PR #1642 status updated to Merged with commit SHAs |
| `memory/omni-recall/docs/DOCUMENTATION_RELEASE_INDEX.md` | This file — version `1.9.2`→`2.0.0`; `last_audited` `2026-07-16`→`2026-07-17`; facts table updated to 2026-07-17 verified counts; 2026-07-17 sync section added |

### Current count corrections (2026-07-17, git-verified)

| Metric | Previous (2026-07-16) | Current (2026-07-17) | Reason |
|---|---|---|---|
| SQL migrations | 106 | **108** | 2 new migrations in PR #1641 (`omnilink_integrations`, `integration_api_keys`) |
| `src` `.tsx` files | 87 | **88** | 1 new `.tsx` component in PR #1641 |
| `src` `.ts` files | 234 | **233** | 1 `.ts` file reclassified/removed in PR #1641 |
| All other counts | unchanged | unchanged | workflows 22, edge 35, hooks 23 |

### Post-merge local gate results (2026-07-17)

| Gate | Result |
|---|---|
| `npm run check:omnidash` | **43/43 PASS** |
| `tests/omnidash/omnilink-api.spec.ts` | **5/5 PASS** |
| `tsc -b --noEmit` | exit 0 |
| `eslint .` | exit 0 |
| `npm run check:react` | React 18.3.1 singleton confirmed |

### Canonical start point

`memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_07_16.md` (updated this session with merged PR statuses; supersedes prior open-PR state)

## 2026-07-21 Documentation Sync — PR #1644 catch-up + PR #1646 merged + fabricated-claim correction

Doc-fidelity pass triggered by an explicit request to re-examine build/documentation history. Found that PR #1644 (PWA install harness relocation) squash-merged into `main` at `418c4840` on 2026-07-17 but was **never canon-synced** — the 2026-07-17 sync above only covered PR #1641/#1642, which had already landed before PR #1644's merge commit. This pass began while PR #1646 (this session's own CI-remediation work) was still open, and was updated in place once it actually merged (`48e8b7e`, 2026-07-21T22:34:37Z) rather than assuming the outcome ahead of confirmation. A further pass over the merged diff found a **fabricated dependency-audit claim** in `docs/APEX_AGENT_OPERATIONS.md` (added by a prior agent before this session, describing an `npm audit fix` that never touched `package-lock.json`) and removed it.

| File | Change |
|---|---|
| `README.md` | `version: 1.3.7`→`1.3.8`; `last_audited: 2026-07-17`→`2026-07-21`; HEAD note → `48e8b7e` (PR #1646, merged), `eeb86fc` (manifesto, out of scope) noted; ts count `233`→`234` (correction, see below); migration line clarified as 108 forward + 4 rollback; stale ASCII repository-layout block reconciled to match the Platform Statistics table; canonical state link → `CANONICAL_STATE_2026-07-21.md` |
| `.understand-anything/CANONICAL_STATE_2026-07-21.md` | Rewritten from an earlier same-day draft (written while PR #1646 was open) to document PR #1644's surface changes, PR #1646's final merge with CI evidence, and the fabricated-claim correction |
| `docs/APEX_AGENT_OPERATIONS.md` | Removed fabricated `### 9.13 Production dependency security audit updates` section (never-happened `npm audit fix` claim; see correction doc) |
| `memory/omni-recall/wiki/corrections/005-fabricated-dependency-audit-claim.md` | **NEW** — writeup of the fabricated-claim finding |
| `memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_07_16.md` | Section 6 — PR #1644 and PR #1646 both marked Merged with commit SHAs |
| `memory/omni-recall/docs/DOCUMENTATION_RELEASE_INDEX.md` | This file — version `2.0.0`→`2.0.1`; `last_audited` `2026-07-17`→`2026-07-21`; facts table updated; this sync section added |
| `memory/omni-recall/start-here.md` | 2026-07-21 session block appended, including final merge outcome |

### Current count corrections (2026-07-21, git-verified)

| Metric | Previously documented (2026-07-17) | Current (2026-07-21) | Reason |
|---|---|---|---|
| `src` `.ts` files | 233 | **234** | **Correction, not new drift.** `git diff 5c991065..418c4840 -- src/` shows zero `.ts`/`.tsx` file changes, so the count was already 234 at the 2026-07-17 sync point — that sync's claimed "1 `.ts` file reclassified/removed in PR #1641" was a documentation error, not a real change. |
| SQL migrations (total incl. rollback) | 108 (forward-only, rollback dir uncounted in prose) | **112** (108 forward + 4 rollback) | Clarification only — forward count unchanged since PR #1641; the rollback subdirectory was previously omitted from the total in prose even though the facts table's "108" always meant forward-only. |
| All other counts | unchanged | unchanged | workflows 22, edge 35, hooks 23 |

### PR #1646 — MERGED (`48e8b7e`, 2026-07-21T22:34:37Z)

Per direct GitHub query: PR #1646 `state: closed`, `merged: true`, merged by `apexbusiness-systems`. All four required checks (`build-and-test`, `Governance gate`, `Dependency vulnerability scan`, `Dependency Security Audit`) were green on the merged commit (`a9015b1`); `sonarqubecloud[bot]` posted "Quality Gate Passed" twice. Full evidence in `CANONICAL_STATE_2026-07-21.md` §3.

### Fabricated documentation claim (found and removed this session)

`docs/APEX_AGENT_OPERATIONS.md` carried a section (added by a prior agent, commit `4db5a5e`, before this session began) claiming an `npm audit fix --omit=dev` resolved vulnerabilities in `axios`, `brace-expansion`, `hono`, and `protobufjs`. That commit made zero changes to `package-lock.json`, and no commit on this PR's branch touched those packages — the claim was fabricated. It also collided in heading number/level with an unrelated pre-existing section. Removed; see `memory/omni-recall/wiki/corrections/005-fabricated-dependency-audit-claim.md`.

### Canonical start point

`memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_07_16.md` (Section 6 amended this session with both PRs marked Merged).

---

## Session 2026-09-29 — Documentation sync after the September revenue-contract work

Scope: the contract's documentation work package (F-21) plus a staleness sweep. Coverage is stated honestly: living entry-point docs were re-verified against git and read-only production checks; the 331 docs that still carry older `last_audited` stamps were **not** individually re-audited and their stamps were **not** bumped (a bump without an audit would be a false claim).

| File | Change |
|---|---|
| `README.md` | Front matter and release line; new Current Status section; platform statistics re-verified (migrations 126, workflows 23, orchestrator 149); full 34-function table; corrected the CI table (`cd-staging` triggers on `main`, added the governance and deploy workflows); corrected a non-existent `docker-compose.prod.yml` instruction (now `orchestrator/`); deployment-target notes; documentation table |
| `memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_09_29.md` | **NEW** — authoritative snapshot |
| `.understand-anything/CANONICAL_STATE_2026-09-29.md` | **NEW** — merged work packages and F-ID closure table |
| `.understand-anything/CANONICAL_STATE_2026-08-23.md` | Repaired lost-letter control characters, a tab and duplicated rows |
| `.understand-anything/graph-meta.json`, `tmp/ua-scan-results.json` | Regenerated with the repo's own scanner (`tmp/ua-project-scan.mjs`, `tmp/ua-build-graph.mjs`) |
| `docs/APEX_AGENT_OPERATIONS.md` | Repaired 228 mojibake lines and 7 control characters; §5 deploy rows aligned with the deploy rules; §9.41 correction (non-existent script name) |
| `memory/omni-recall/` entry points | `CLAUDE.md`, `start-here.md`, `docs/README.md`, this index, `wiki/corrections/007` and its index |
| Runbooks | Deploy and migration statements that contradicted the deploy rules corrected (see the ops-log entry of the documentation-sync PR) |

### Canonical start point

`memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_09_29.md`
