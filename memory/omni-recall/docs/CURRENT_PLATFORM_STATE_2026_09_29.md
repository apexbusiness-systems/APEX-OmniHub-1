---
version: 1.8.3
last_audited: 2026-09-29
status: verified
scope: APEX-OmniHub platform baseline after the September 2026 revenue-contract work (APEX-REV-2026-09)
supersedes: CURRENT_PLATFORM_STATE_2026_07_16.md
---

# APEX-OmniHub Current Platform State — 2026-09-29 Baseline

Authoritative, git-verified snapshot. Counts come from the commands in section 8; production facts come from read-only checks made on 2026-09-29 and are labelled as such. Repo evidence is not live production proof: anything not exercised is labelled `VERIFIED-IN-CODE` or `REQUIRES_LIVE_VALIDATION`.

---

## 1. Executive Summary

- **Baseline commit:** `main` @ `6c62fdb8` (2026-09-29, merge of PR #25, the audit-log write path part B).
- **Release line:** `1.8.3` (`package.json`); app package (`apps/omnihub-site/package.json`) `1.3.10`. **No release has been cut since v1.8.3** (2026-08-23). The September work below is on `main` but unreleased; releases stay manual and owner-driven (`changeset version` → `chore: version packages`).
- **What changed since the previous snapshot (2026-08-23):** the revenue-contract work packages (billing tier provisioning, subscription lifecycle sync, entitlement matrix, lead capture, client-bundle secret removal), the PhysiOmni ingest hardening and `physiomni-ingress` retirement, the production deploy-workflow gate, and MCP-gateway least privilege. Detail in sections 3–5.
- **What is merged is not necessarily live.** Web builds go live on merge; database migrations and edge functions do not (section 4).

---

## 2. Git-Verified Repository Statistics (2026-09-29)

| Metric | Count | Notes |
|---|---:|---|
| **Source files (`src/`)** | 322 | 234 `.ts` + 88 `.tsx` |
| **React components (`src/`)** | 88 | `.tsx` files |
| **Custom hooks (`src/`)** | 23 | `use*.ts*` |
| **Edge functions (`supabase/functions/`)** | 35 dirs | 34 functions + `_shared`; matches `scripts/ci/edge-functions.manifest.json` (34) |
| **Database migrations (`supabase/migrations/`)** | 126 | 116 forward + 10 rollback (`migrations/rollback/`) |
| **CI/CD workflows (`.github/workflows/`)** | 23 | adds `deploy-mcp-gateway.yml` |
| **Test/spec sources (whole repo)** | 491 | counted with the section 8 command; earlier snapshots used a different scan and are not comparable |
| **Orchestrator (Python)** | 149 | tracked files, excluding `__pycache__` |
| **Tracked Markdown files** | 646 | after this sync adds three (this file, the 2026-09-29 canonical state, correction 007) |
| **Vitest (root) at this baseline** | 3216 passed, 70 skipped, 25 todo (303 test files passed, 17 skipped) | full-suite run on this branch |

---

## 3. Merged since 2026-08-23 (`git log --first-parent`)

| Date | Commit | Change |
|---|---|---|
| 2026-08-31 | `ae940811` | `apex-standards` agent skill (`.agents/skills/apex-standards/`) and Phase 4 pilot test enhancements |
| 2026-09-04 | `b15cd71c`, `841e2b17` | Production-safe validation harness; release matrix items promoted to `VERIFIED` with machine evidence (auth, persistence, multi-tenant RLS); ops-log §9.41 |
| 2026-09-28 | `61861aab` (#14) | `docs/contracts/REVENUE_EXECUTION_CONTRACT.md` and WP-00 baseline |
| 2026-09-28 | `37d3c22e` (#15) | WP-05 — canonical `access_requests` migration, idempotent anon-only submit |
| 2026-09-28 | `89d81ee8` (#16) | WP-09 — client-bundled MCP secrets removed; `check:client-secret-env` guard; stale `verify_jwt` config removed |
| 2026-09-28 | `6d62a635` (#18) | WP-05b — lead capture on by default; `notify-access-request` alert function |
| 2026-09-28 | `bb22baf0` (#19) | WP-01→03 — `BUS`→`business`, Base→`free`, subscription lifecycle sync (`constructEventAsync`), entitlement matrix, Business parity |
| 2026-09-28 | `b6c0cabc` | Post-merge findings, `mcp-proxy` security review, orchestrator hosting memo |
| 2026-09-28 | `040c6d6a` (#21) | `physiomni-ingest` fail-closed auth; `physiomni-ingress` retired and removed |
| 2026-09-29 | `5f534417` (#22) | `Deploy Web3 Functions` made manual, reviewer-gated, functions-only |
| 2026-09-29 | `637f7fe1` (#23) | MCP gateway scoped keys (read/write), per-call audit, rate limits; `deploy-mcp-gateway.yml` |
| 2026-09-29 | `c46cd5fa` (#24) | Audit-log write path, part A: `record_client_audit_event()` (migration `20260929000000`, additive), `apex-agent` audit row via the service client, `target` choice input on `Deploy Web3 Functions` |
| 2026-09-29 | `6c62fdb8` (#25) | Audit-log write path, part B: browser writer calls the function; migration `20260929000100` (guarded; drops the client INSERT policy and revokes INSERT); RSI protected-path evidence requirement documented |

Full detail per change: `docs/APEX_AGENT_OPERATIONS.md` §9.41–§9.53.

**Not merged at this baseline:** the remaining revenue-contract stack (audit-log follow-up, a Stripe follow-up fix, claims and copy changes, funnel instrumentation). This snapshot does not describe them.

---

## 4. Production State (read-only checks, 2026-09-29)

| Surface | Fact | How verified |
|---|---|---|
| **Web build** | The `apex-omnihub` Cloudflare Pages project builds from GitHub `main` with automatic production deployments **enabled**: every merge to `main` goes live. The `release.yml` routing-flip gate applies only to release-cut commits. Latest production deployment: `6c62fdb8` (the PR #25 merge), succeeded 2026-09-29 14:20 UTC. | Cloudflare Pages API (read), `release.yml:3-6,63-70,218-223` |
| **Shadow web build** | `apex-omnihub-shadow`: production deployments off, no build command; branch previews set to `none` on 2026-09-29. | Cloudflare Pages API (read, then owner-instructed PATCH) |
| **Edge functions** | 35 deployed; 29 of the 34 repo functions are deployed. **Not deployed:** `mcp-proxy` (do not deploy — see `docs/contracts/MCP_PROXY_SECURITY_REVIEW.md`), `notify-access-request`, `omnibridge-control`, `physiomni-action`, `physiomni-ingest`. **Deployed but absent from the repo (stale):** `lovable-audit`, `lovable-device`, `lovable-healthcheck`, `supabase_healthcheck`, `omnilink-agent`, `test-integration`. | Supabase Management API `GET /functions` (read) |
| **Deployed code age** | `stripe-webhook` (2026-07-12), `create-checkout` and `activate-client` (2026-07-02), `mcp-gateway` (2026-07-14) and `apex-agent` (2026-06-17) were last deployed **before** the September fixes merged, so the merged billing, activation, gateway and `apex-agent` audit changes are **not live** until deployed. | same API, `updated_at` |
| **Database migrations** | Applied through `20260928000000` (`access_requests_canonical`). **Pending, owner-applied in order:** `20260928010000`, `20260928020000`, `20260928020100` (backfill; run its count query first), `20260928030000`, then `20260929000000` (audit function, part A) and, only after part A is applied and `apex-agent` is redeployed, `20260929000100` (part B). | Management API `GET /database/migrations` (read) |
| **Deploy paths** | Production edge functions deploy only from CI on `main`. Both deploy workflows (`deploy-web3-functions.yml`, which now takes a `target` choice of `web3-and-billing` or `apex-agent`, and `deploy-mcp-gateway.yml`) are `workflow_dispatch` only, run in the `production-db` environment (required reviewer) and never run migrations. `physiomni-ingress` deleted from production 2026-09-29. | workflows in repo; ops-log §9.51–§9.53 |
| **Live condition (found 2026-09-29, ~15:20 UTC)** | The live web build already calls `record_client_audit_event()`, but migration `20260929000000` is not applied in production, so browser audit events currently fail and retry (the client writer never blocks a user flow: ops-log §9.55). They stop failing once migration A is applied; deploy `apex-agent` with `target = apex-agent` as well. No user-facing behaviour is affected. | Cloudflare Pages API and Management API `GET /database/migrations` (read) |
| **Orchestrator** | Python/Temporal code is in the repo (149 files); the hosted service is suspended and the revenue path does not depend on it. Hosting decision is open. | `memory/omni-recall/rfc/RFC_2026_09_28_ORCHESTRATOR_HOSTING.md` |

Owner-side items this pass could not verify: existence of the `production-db` GitHub environment and its secrets, `MCP_GATEWAY_READ_KEY`/`MCP_GATEWAY_WRITE_KEY`, `LEAD_ALERT_TO`/`LEAD_ALERT_FROM`, Stripe price IDs.

---

## 5. Release Evidence Boundary

- **Authority:** `docs/release/release-validation-matrix.json` — 20 items: 19 `VERIFIED`, 1 `HONESTLY_GATED` (`REQUEST_ACCESS_PROOF`, which needs a test write against the backend). Auth, OmniDash persistence and multi-tenant RLS were last promoted on 2026-09-04–05 (machine evidence under `artifacts/production-validation/`).
- The matrix has no items for the September changes. They are `VERIFIED-IN-CODE` (unit and contract tests); their live behaviour is `REQUIRES_LIVE_VALIDATION` after the owner applies migrations and deploys functions. Business checkout and PhysiOmni telemetry must not be presented as live (`docs/contracts/ENTITLEMENT_MATRIX.md`).
- CI validates and attaches SBOM evidence; CI does not decide or certify releases.

---

## 6. Open Items (owner decisions and actions)

- Apply the pending migrations in order (the four 2026-09-28 ones, then audit part A now and part B only after `apex-agent` is redeployed); deploy `apex-agent` (`target = apex-agent`), `stripe-webhook`, `create-checkout`, `activate-client`, `notify-access-request`; set `LEAD_ALERT_TO`/`LEAD_ALERT_FROM` (ops-log §9.50).
- Create the `production-db` environment and set its secrets; set `MCP_GATEWAY_READ_KEY`, then dispatch `Deploy MCP Gateway` (§9.52–§9.53).
- WP-04 (whether Business enters the activation wizard), WP-07 (crawlable marketing routes: deploy the site SSG output or layer prerendered routes), WP-10 (usage caps, D3).
- Claims register items O1–O8, legal review of outreach templates (CASL), dataroom visibility (`REVENUE_EXECUTION_CONTRACT.md` §6).
- PhysiOmni PX-1: `[functions.physiomni-ingest]` config entry and retirement of the `PHYSIOMNI_INGRESS_HMAC_SECRET` variable.
- Orchestrator CI `Security Scan` (`.github/workflows/orchestrator-ci.yml`) fails on `main` for any change that starts it. `main` last ran it on 2026-08-18 (green); since then `safety check` flags `setuptools 79.0.1` (SFTY-20260721-58460, the runner image copy; `orchestrator/uv.lock` pins 83.0.0) and `cuda-toolkit 13.0.3.0` (SFTY-20260120-40557 / CVE-2025-33228, an Nsight Systems script flaw fixed in 13.1.0; `torch 2.13.0` requires `==13.0.3`; the orchestrator never invokes Nsight). Fix in its own pull request: upgrade `setuptools` in the job and add a justified `--ignore` for the second advisory. The same pull request carries the `orchestrator/README.md` path fix (ops-log §9.56 (j)). The Bandit step of that job has not run since the safety step fails first, so its state is unverified.
- Documentation limits: `RequestAccess.tsx` is 777 lines (over the 600-line policy); `docs/APEX_AGENT_OPERATIONS.md` and other living docs carry bulk `last_audited: 2026-06-*` stamps that were not individually re-audited in this pass (section 7).

---

## 7. Documentation Sync Scope (this pass)

- **Rewritten or extended:** root `README.md`; `.understand-anything/CANONICAL_STATE_2026-09-29.md` (new) and regenerated scan/meta artifacts; `memory/omni-recall/` entry points (`CLAUDE.md`, `start-here.md`, `docs/README.md`, `docs/DOCUMENTATION_RELEASE_INDEX.md`, this file); the deploy and migration statements that contradicted the new deploy rules.
- **Repaired corruption:** 228 mojibake lines and 7 lost-letter control characters in `docs/APEX_AGENT_OPERATIONS.md`; 4 lost-letter control characters, a tab and duplicated rows in `.understand-anything/CANONICAL_STATE_2026-08-23.md`.
- **Deliberately not changed:** dated historical records (`CANONICAL_STATE_*`, `CURRENT_PLATFORM_STATE_*`, audits, RFCs) keep their original content; their `last_audited` stamps were **not** bumped, because bumping a stamp without a re-audit would claim an audit that did not happen.

---

## 8. Verification Commands

```bash
git rev-parse --short HEAD
git ls-files src | grep -E '\.(ts|tsx)$' | wc -l              # 322 (tsx: grep -E '\.tsx$' -> 88)
git ls-files src | grep -E '/use[^/]*\.tsx?$' | wc -l          # 23
ls -d supabase/functions/*/ | wc -l                            # 35 (34 + _shared)
git ls-files supabase/migrations | grep -E '^supabase/migrations/[^/]+\.sql$' | wc -l   # 116 forward
git ls-files supabase/migrations/rollback | wc -l              # 10
git ls-files .github/workflows | grep -E '\.ya?ml$' | wc -l    # 23
git ls-files orchestrator | grep -v __pycache__ | wc -l        # 149
git ls-files | grep -E '\.(test|spec)\.(ts|tsx|py|mjs|js)$|/test_[^/]*\.py$' | wc -l   # 491
npm run docs:check && npm run check:edge-fn-manifest && npm run check:ops-doc-claim-integrity
```
