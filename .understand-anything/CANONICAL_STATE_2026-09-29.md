# Canonical State Record - 2026-09-29 (Revenue Contract APEX-REV-2026-09: merged work packages and finding closure)

Authoritative snapshot of repo state as of 2026-09-29. Verified HEAD: `main` @ `6c62fdb8`. Release line unchanged at `1.8.3` (no release cut since 2026-08-23). Counts and production facts: `memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_09_29.md`. Status labels follow contract N8: `VERIFIED` only for what was exercised; otherwise `VERIFIED-IN-CODE`, `REQUIRES_LIVE_VALIDATION` or `REQUIRES_OWNER_ACTION`.

## 1. Work packages merged into `main`

| WP | PR / commit | Result |
|---|---|---|
| WP-00 baseline | #14 `61861aab` | Contract committed; F-01 to F-22 re-verified; F-23 to F-25 added |
| WP-05 lead capture integrity | #15 `37d3c22e` | Canonical `access_requests` migration; idempotent anon-only submit |
| WP-09 security hygiene | #16 `89d81ee8` | Client-bundled secrets removed; `check:client-secret-env` guard; stale `verify_jwt` config removed |
| WP-05b lead alerts | #18 `6d62a635` | Lead capture on by default; `notify-access-request` function and trigger |
| WP-01 / WP-02 / WP-03 | #19 `bb22baf0` | Tier provisioning, webhook lifecycle sync, entitlement matrix and Business parity (one squash commit) |
| PhysiOmni ingest | #21 `040c6d6a` | `physiomni-ingest` fail-closed; `physiomni-ingress` retired |
| Deploy gate | #22 `5f534417` | `Deploy Web3 Functions` manual, reviewer-gated, functions-only |
| MCP-H1 | #23 `637f7fe1` | MCP gateway scoped read/write keys, per-call audit, rate limits |
| Audit-log write path (outside the WP list) | #24 `c46cd5fa`, #25 `6c62fdb8` | Part A: `record_client_audit_event()` and the `apex-agent` service-client audit row, plus a `target` choice on `Deploy Web3 Functions`. Part B: browser writer calls the function; migration `20260929000100` drops the client INSERT policy and revokes INSERT (guarded on part A) |

Not merged at this snapshot: WP-04 (stopped for an owner decision), WP-06, WP-07 (owner decision), WP-08, WP-10 (owner decision D3).

## 2. Finding closure table (F-IDs from `docs/contracts/REVENUE_EXECUTION_CONTRACT.md` section 4)

"Live" means running for users today. Web-build changes are expected to reach users on merge, because automatic production deployments are enabled on `main` (the deployed commit was not checked in this pass); migrations and edge-function changes need the owner (see the platform-state snapshot, section 4).

| ID | Sev | Status on `main` | Live? | Notes |
|---|---|---|---|---|
| F-01 | CRITICAL | RESOLVED-IN-CODE (WP-01) | No | Activation RPC maps `BUS` to `business`; migration `20260928020000` pending; `create-checkout`, `stripe-webhook`, `activate-client` need deploying. `STRIPE_PRICE_ID_BUS` is set in production, so do not enable Business checkout before the deploy (ops-log 9.50). |
| F-02 | CRITICAL | RESOLVED-IN-CODE (WP-01) | No | Base maps to `free`; OmniDash policies admit signed-in owners (D1 option a). Backfill migration `20260928020100` matched 0 production rows on 2026-09-28. |
| F-03 | CRITICAL | RESOLVED-IN-CODE (WP-02) | No | `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed` sync from Stripe. Deploy pending. Stripe endpoint already subscribed. |
| F-04 | HIGH | RESOLVED-IN-CODE (WP-02) | No | `constructEventAsync` with `SubtleCryptoProvider`. Delivery behaviour is `REQUIRES_LIVE_VALIDATION`. |
| F-05 | MEDIUM | SCOPE AMENDED; matrix committed (WP-03) | Partly | `docs/contracts/ENTITLEMENT_MATRIX.md`. Audit export gated to Business through `usePlan`; skill caps treat Business like Pro. `PaidAccessRoute` still has no consumers. |
| F-06 | HIGH | OPEN (WP-04 stopped) | n/a | The wizard handles BASIC and PRO only. Owner decision pending on Business. |
| F-07 | HIGH | OPEN (WP-06 unmerged) | n/a | |
| F-08 | HIGH | RESOLVED | Yes | Root migration on `main`; applied to production 2026-09-28 (4 policies, RLS on). |
| F-09 | MEDIUM | RESOLVED-IN-CODE (WP-05) | Web build | Repeat email no longer hits the denied UPDATE path. Runtime `REQUIRES_LIVE_VALIDATION`. |
| F-10 | HIGH | RESOLVED-IN-CODE (WP-05b) | No | Migration `20260928010000` pending; `notify-access-request` not deployed; `LEAD_ALERT_TO`/`LEAD_ALERT_FROM` unset. |
| F-11 | HIGH | OPEN (WP-07) | n/a | Cause diagnosed (ops-log 9.50): production deploys the root SPA build; SSG runs only as a CI gate. Owner picks the deploy option. |
| F-12 | HIGH | OPEN (WP-08 unmerged) | n/a | |
| F-13 | MEDIUM | OPEN (WP-08 unmerged) | n/a | "Priority orchestration & routing" is NOT-IMPLEMENTED; PhysiOmni telemetry is NOT-LIVE. |
| F-14 | MEDIUM | OPEN, BLOCKED on D3 | n/a | No caps supplied; not invented. |
| F-15 | MEDIUM | RESOLVED-IN-CODE (WP-09) | Web build | Four `VITE_` secret injections removed. Owner action O4: rotate keys if ever set as build variables. |
| F-16 | LOW | RESOLVED (WP-09) | Repo only | Config blocks removed. The 6 stale deployed functions remain in production (owner action; no invocation proof to delete). |
| F-17 | LOW | RESOLVED-IN-CODE (WP-02) | No | Rate limit keyed by caller IP. Deploy pending. |
| F-18 | HIGH (legal) | OPEN | n/a | Counsel review (O6). |
| F-19 | MEDIUM | OPEN | n/a | Repo visibility (O5). |
| F-20 | LOW | OPEN | n/a | Root clutter files untouched by this pass. |
| F-21 | LOW | RESOLVED by the documentation sync that adds this file | n/a | `CLAUDE.md` H1 corrected; README, snapshot and this record updated. |
| F-22 | STRATEGIC | OPEN | n/a | Burn-ledger costs still unfilled (O8). |
| F-23 | (WP-00) | RESOLVED-IN-CODE (WP-01) | No | `user_entitlements` tier CHECK accepts `BUS`; migration pending. |
| F-24 | (WP-00) | RESOLVED-IN-CODE (WP-03) | No | Migration `20260928030000` pending; `omnilink-port` redeploy needed for the `BUS` skill cap. |
| F-25 | (WP-00) | RESOLVED-IN-CODE (WP-03) | Web build | UI tier maps include `business`. |

## 3. Other verified changes

| Area | Fact |
|---|---|
| PhysiOmni | `physiomni-ingest` refuses requests without a configured signing key; not deployed; 0 devices. `physiomni-ingress` deleted from production and the repo. Follow-ups (PX-1): `config.toml` entry, retire the legacy variable name. |
| MCP gateway | Read and write keys are separate; the write key stays unset so writes fail closed; the legacy key is read-only until rotated. Deployed function still predates this change. |
| Audit log (live condition, 2026-09-29 ~15:20 UTC) | The live web build (`6c62fdb8`) already calls `record_client_audit_event()`, but migration `20260929000000` is not applied in production, so browser audit events fail and retry until it is; no user flow is affected. `apex-agent` also still runs its 2026-06-17 code. Apply part A and deploy `apex-agent` (`target = apex-agent`) before part B. |
| Deploy rule | Production edge functions deploy only from CI on `main`, manually, in the `production-db` environment. |
| `mcp-proxy` | Not deployable in the Edge Runtime (spawns subprocesses); do not deploy (`docs/contracts/MCP_PROXY_SECURITY_REVIEW.md`). |
| Corrections | `CANONICAL_STATE_2026-08-23.md` and `docs/APEX_AGENT_OPERATIONS.md` had lost-letter control characters (and the ops log 228 mojibake lines); repaired in this sync. |

## 4. Verified quality gates at this baseline

Run on the documentation-sync branch (based on `6c62fdb8`); the exact results are recorded in the ops-log entry of the sync PR.
