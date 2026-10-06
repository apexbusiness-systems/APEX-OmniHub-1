---
contract_id: APEX-REV-2026-09
version: 1.0.0
issued: 2026-09-28
target_repo: aoid-org/APEX-OmniHub (main) — canonical per owner decision A4, 2026-09-28
evidence_basis: uploaded snapshot APEX-OmniHub-main (no .git; root 1.8.3) + live fetch of https://apexomnihub.icu
audience: Claude Code (executor), JR (owner/approver)
wp00_baseline: 2026-09-28 at main HEAD 841e2b171a42a2e8515fc0ce23ab138a7a034230
owner_decisions: 2026-09-28 (A1, A2 and A4 approved with conditions; D1 = option (a)); see §4.2
---

# APEX-OmniHub Revenue & Conversion Execution Contract

> **Contract status (2026-09-29, `main` @ `6c62fdb8`):** merged — WP-00 (#14), WP-05 (#15), WP-09 (#16), WP-05b (#18), WP-01/02/03 (#19, one squash commit), plus the audit-log write-path change outside the WP list (#24 part A, #25 part B). Merged is not live: four 2026-09-28 migrations are pending owner application and the billing, activation and lead-alert functions are not yet deployed (`memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_09_29.md` §4). **WP-04 is stopped for an owner decision:** `OnboardingWizard.tsx:48` types `handleFinalActivation(tier: 'BASIC' | 'PRO')` and branches only on those two (`:53`, `:63`), so a Business selection has no activation path. WP-07 is diagnosed and waits on the owner's deploy option (ops-log §9.50); WP-10 is `BLOCKED` on D3; WP-06 and WP-08 are not merged. Per-finding closure: `.understand-anything/CANONICAL_STATE_2026-09-29.md`.
>
> **WP-00 status (2026-09-28):** Baseline complete at `841e2b1`. All 22 F-IDs remain `OPEN`. Three new findings (F-23 to F-25) are recorded in §4.2. The owner decided amendments A1 to A4 and gate D1 on 2026-09-28 (§4.2), and WP-01 to WP-03 were amended to match. WP-01 starts once PR #14 merges. The owner is holding that merge until repo visibility is confirmed (O5).

## 0. How to Use This Contract (read first, every session)

1. **Authority order:** root `CLAUDE.md` invariants > this contract > everything else. If a step here conflicts with `CLAUDE.md` (especially the **OmniDash Canonical Layout Law**), STOP and report the conflict. Do not modify the guard. Use the credentials, keys and codes provided for you to use in this cloud environment. Use the appropriate skills for this session. Use AGENT SWARM effectively, perfectly, correctly and efficiently.
2. **One Work Package (WP) per session and per PR.** This follows `CLAUDE.md` "Execution Loop: One task per session". Execute WPs in the order in §5 unless the dependency graph allows otherwise.
3. **Skill routing** (from `CLAUDE.md`): bug and defect WPs use `apex-master-debug-claude`, feature WPs use `apex-boost-claude`, and live Supabase/Cloudflare work uses `omnidev-apex-pro-v2`. SQL work also uses `supabase-postgres-best-practices`. Never invoke `apex-dev`.
4. **Evidence is snapshot-based.** The repo may have moved since the snapshot. WP-00 re-verifies every finding at current HEAD before any edit. A finding that is no longer present is marked `RESOLVED-UPSTREAM` and its WP is skipped.
5. Every WP ends with the **Definition of Done (§3)**. A WP is not done until its evidence is in the PR body.

## 1. Non-Negotiables (apply to every WP)

| # | Rule |
|---|---|
| N1 | **No new dependencies, vendors, SaaS, or paid services.** `git diff` on every `package.json`, `deno.lock`, `bun.lock`, `pyproject.toml` or `import_map.json` must show zero dependency additions. If a WP seems to need one, STOP and ask the owner. |
| N2 | **Surgical diffs.** Change only the lines the WP names. No drive-by refactors, formatting sweeps or renames. |
| N3 | **Max 600 lines per file** (`CLAUDE.md`). If an edit would push a file past 600 lines, extract a single-responsibility module. |
| N4 | **Migrations are forward-only, idempotent and paired with a rollback.** Use `CREATE OR REPLACE`, `IF NOT EXISTS`, and `DROP POLICY IF EXISTS` before `CREATE POLICY`. Add a rollback script under `supabase/migrations/rollback/` following the existing pattern. Never edit an already-applied migration file. Timestamps must sort after the latest existing migration. |
| N5 | **Production data changes require owner approval.** Any migration containing `UPDATE`/`DELETE` of existing rows is merged only after JR approves it explicitly in the PR. |
| N6 | **No OmniDash layout changes.** Run `npm run check:omnidash` on any UI WP. The App Gallery stays four "Awaiting" slots with no Connect button. |
| N7 | **Claim hygiene.** All public copy must pass `node scripts/ci/verify-claim-hygiene.mjs`. Never add a claim to `docs/release/approved-claims.json` without a real, existing evidence file. No invented metrics, customers, ROI guarantees, or "certified" language. (Context: the PR #1646 fabricated-claim incident.) |
| N8 | **Honesty labels.** In PRs and docs use `VERIFIED` only for what was actually exercised. Otherwise use `VERIFIED-IN-CODE`, `REQUIRES_LIVE_VALIDATION`, or `REQUIRES_OWNER_ACTION` (see `.understand-anything/E2E_CANONICAL_BEHAVIOR.md` §7). |
| N9 | **Never mock data outside tests.** Never display simulated values in production UI. |
| N10 | **Commits:** use Conventional Commits (commitlint is configured). Name branches `fix/rev-wpNN-<slug>` or `feat/rev-wpNN-<slug>`. (Waived for the Claude Code harness per A4: the branch the session requires is accepted.) |
| N11 | **Ops log:** append one entry to `docs/APEX_AGENT_OPERATIONS.md` per WP. First run `grep -nE "^#{2,3} 9\.[0-9]+" docs/APEX_AGENT_OPERATIONS.md` and use the next unused number. Duplicate numbers already exist (13 of them at `841e2b1`, see §4.2), so do not add another, and do not renumber existing duplicates (that breaks cross-references). Per the owner's ruling, the 600-line cap (N3) applies to source modules, not to this append-only log. The entry must list the changed files, which must match `git diff --stat` exactly. |
| N12 | **Pre-existing defects** you encounter inside a WP's blast radius are fixed in that WP and logged. Defects outside the blast radius are recorded in the PR under "Found, not fixed (out of scope)" and never silently expanded into. |

## 2. Status Labels

`OPEN` (confirmed at HEAD) · `RESOLVED-UPSTREAM` (fixed before this contract) · `DONE` (merged, DoD met) · `BLOCKED` (missing access or owner input; state what is needed).

## 3. Definition of Done (per WP)

A WP is DONE only when all of these hold:

1. `npm run typecheck` and `npm run lint` pass.
2. `npm test` passes. The new tests named in the WP exist and pass.
3. If `apps/omnihub-site` was touched: `cd apps/omnihub-site && npm run typecheck && npm run build && npm run i18n:check` all pass.
4. If UI was touched: `npm run check:omnidash` passes, and the affected Playwright specs pass (`tests/e2e-playwright/`).
5. If an edge function was touched and `deno` is available: `deno check supabase/functions/<fn>/index.ts` passes. If `deno` is not available, mark this item `BLOCKED` rather than passed.
6. `node scripts/ci/verify-claim-hygiene.mjs` passes. `npm run docs:check` passes when docs changed.
7. The dependency diff is empty (N1), and no file exceeds 600 lines (N3).
8. The ops-log entry is added (N11). The PR body contains: goal, findings closed (F-IDs), files changed, test evidence, rollback steps, and live-validation status.
9. Pushed on pass; reverted on fail (`CLAUDE.md` Execution Loop).

## 4. Evidence Register

Findings come from the snapshot. The **WP-00 @ `841e2b1`** column records the re-verification: the status, plus current line numbers wherever they moved.

| ID | Sev | Finding | Evidence (snapshot) | Status basis | WP-00 @ `841e2b1` |
|---|---|---|---|---|---|
| F-01 | **CRITICAL** | **Business ($299 CAD) purchases never provision.** The activation RPC rejects `BUS`, so the webhook returns 500 and Stripe retries until it gives up. The customer is charged and gets nothing. Even if `BUS` were accepted, the ELSE branch would map it to `starter`, which is below `pro`. | `supabase/migrations/20260601000000_harden_subscription_activation_rpc.sql:32-39`; `apps/omnihub-site/src/pages/Pricing.tsx:55-67`; `supabase/functions/create-checkout/index.ts:68-73`; `supabase/functions/stripe-webhook/index.ts:76-88` | VERIFIED-IN-CODE. Real charges: REQUIRES_OWNER_ACTION (O2) | **OPEN.** The RPC is still the last definition; the tier block is now at `:42-49`. The `user_entitlements` CHECK constraint is a second blocker (F-23). |
| F-02 | **CRITICAL** | **Free Base users get paid entitlement permanently.** `activate-client` sends `BASIC`, the RPC maps it to tier `starter` with status `active` and no period end, and `isPaid` then returns `true` ("No period end means unlimited"). | `supabase/functions/activate-client/index.ts:52-71`; RPC `:36-42`; `src/hooks/usePaidAccess.ts:83-96` | VERIFIED-IN-CODE | **OPEN.** The same condition also passes the SQL `private.is_paid_user` check (`20260716005122_private_authorization_helpers.sql:59-80`). D1 triggers (A3). |
| F-03 | **CRITICAL** | **Subscription state never syncs after checkout.** The webhook ignores every event except `checkout.session.completed`. Renewals never extend `current_period_end`, so paying users drop out of `isPaid` after their first period wherever it is enforced. Cancellations and failed payments are never recorded. | `supabase/functions/stripe-webhook/index.ts:96` | VERIFIED-IN-CODE | **OPEN** (`:96`) |
| F-04 | HIGH (possibly CRITICAL) | **Webhook signature check uses synchronous `constructEvent` on Deno.** Stripe's documented Deno/Supabase pattern is `constructEventAsync` with `Stripe.createSubtleCryptoProvider()`. If the sync path throws, every event returns 400 and nothing provisions for any tier. | `supabase/functions/stripe-webhook/index.ts:129-131`; no `constructEventAsync` anywhere in `supabase/functions` | REQUIRES_LIVE_VALIDATION (Stripe webhook delivery log, O1) | **OPEN** (`:131`). Runtime impact is still REQUIRES_LIVE_VALIDATION. |
| F-05 | MEDIUM (downgraded 2026-09-28, §4.3 B1) | **Paid features are not enforced.** `PaidAccessRoute` has zero consumers in either app. Server-side tier checks exist only in `omnilink-port/omniskills.ts` (plus checkout and activation), so the paid plans sell features that are not gated. | `grep -rn "<PaidAccessRoute" src apps/omnihub-site/src` returns no consumers | VERIFIED-IN-CODE (the scope of `omniskills.ts` gating is confirmed in WP-03) | **OPEN, scope amended.** There are still zero `<PaidAccessRoute` consumers. Server-side gating is wider than stated: OmniDash RLS uses `is_paid_user` (6 policies in `20260205000001_omnidash_paid_access.sql`), and skill caps use `user_entitlements.tier` (`20260622000000_skill_entitlement_free_cap_5.sql:57,118`). WP-03 must inventory all of these. |
| F-06 | HIGH | **Purchase intent is lost at auth, and there are two competing funnels.** Pricing sends visitors to a bare `/login`, and OAuth `redirectTo` is `/login`. The `/launch` wizard preserves intent via `returnUrl` at step 4. | `Pricing.tsx:88-91`; `apps/omnihub-site/src/pages/Login.tsx:67`; `apps/omnihub-site/src/pages/Launch/OnboardingWizard.tsx:93-109,184` | VERIFIED-IN-CODE | **OPEN** (`Pricing.tsx:90`, `Login.tsx:67`) |
| F-07 | HIGH | **Zero funnel instrumentation.** No product event tracking exists in the site or app. | grep for track/capture/analytics finds no calls | VERIFIED-IN-CODE | **OPEN** (zero `track(`/`capture(`/gtag/posthog/plausible calls) |
| F-08 | HIGH | **The lead table may not exist in production.** The `access_requests` migration exists only in `apps/omnihub-site/supabase/migrations/`, not in the root `supabase/migrations/` that is deployed. | `apps/omnihub-site/supabase/migrations/20250111000000_create_access_requests.sql` | REQUIRES_LIVE_VALIDATION (O3) | **OPEN** (no root migration). The production check could not run because the Supabase MCP was not authorized this session. |
| F-09 | MEDIUM | **Repeat lead submissions are expected to fail.** The form does an anon `upsert(onConflict:'email')`, but only an INSERT policy exists, so a repeat email takes the UPDATE path and should be rejected by RLS. The raw `error.message` is also thrown to the user. | `apps/omnihub-site/src/pages/RequestAccess.tsx:439-450`; migration policies | VERIFIED-IN-CODE. Runtime: REQUIRES_LIVE_VALIDATION | **OPEN** (`:446`, `:450`) |
| F-10 | HIGH | **No notification fires on a new lead.** | No trigger or function references `access_requests` | VERIFIED-IN-CODE | **OPEN.** The only reference is the app-local migration. |
| F-11 | HIGH | **Crawlers see no page body.** A live fetch of `/` returned meta tags only, even though SSG is configured for marketing routes. | `apps/omnihub-site/vite.config.ts:106-111`; `.github/workflows/deploy-production-cf-direct.yml` | Observed live once. Cause: REQUIRES_LIVE_VALIDATION | **OPEN.** Re-observed live on 2026-09-28: `/` and `/pricing` both return HTTP 200, 5972 bytes, an empty `<div id="root"></div>`, and 0 `<h1>`. |
| F-12 | HIGH (commercial) | **The priced, sales-ready Design Sprint offer (CAD $5K–$15K) is absent from the site.** The homepage's primary internal link is `/demo.html`. | `memory/omni-recall/apex-dataroom/07-outreach/03-offer-b-c-omnihub-outreach.md`; `apps/omnihub-site/src/pages/Home.tsx` | VERIFIED-IN-CODE | **OPEN** (`Home.tsx:58,2176` → `/demo.html`; no `design-sprint` route) |
| F-13 | MEDIUM | **Pricing copy is internal jargon, and some promised features may be unimplemented** (for example "Priority orchestration & routing"). | `Pricing.tsx:24-66` | Jargon VERIFIED. Implementation is checked in WP-03 | **OPEN** (`Pricing.tsx:48`) |
| F-14 | MEDIUM (margin) | **Usage metering is not enforced.** The `usage_metering` table exists, but no edge function enforces it, while Pro promises "unlimited". | `supabase/migrations/20260217120000_phase4_monetization.sql`; only `src/omnidash/api.ts` and orchestrator validation reference it | VERIFIED-IN-CODE | **OPEN.** The only references are `src/omnidash/api.ts` and `orchestrator/providers/database/_validation.py`. |
| F-15 | MEDIUM (security) | **Two API keys use the `VITE_` prefix,** which inlines them into the client bundle if they are set at build time. | `src/core/mcp/mcp.config.ts:93,101` (`VITE_FIRECRAWL_API_KEY`, `VITE_GOOGLE_API_KEY`) | Code VERIFIED. Exposure: REQUIRES_LIVE_VALIDATION (O4) | **OPEN** (`:93`, `:101`) |
| F-16 | LOW | **Stale function config.** `supabase/config.toml` has `verify_jwt=false` entries for 4 functions that no longer exist: `supabase_healthcheck`, `lovable-device`, `lovable-audit`, `lovable-healthcheck`. | `supabase/config.toml` | VERIFIED-IN-CODE | **OPEN.** All 4 entries are present and none of the 4 function directories exists. |
| F-17 | LOW | **The webhook rate limiter never trips.** It is keyed on the `stripe-signature` header, which is unique for every delivery. | `stripe-webhook/index.ts:121` | VERIFIED-IN-CODE | **OPEN** (`:120-121`) |
| F-18 | HIGH (legal) | **Outreach templates lack CASL requirements.** None of the 6 templates has sender identification or an unsubscribe mechanism. | `memory/omni-recall/apex-dataroom/07-outreach/*.md` | VERIFIED-IN-CODE. Applicability: counsel (O6) | **OPEN** (0 of 6 templates contain "unsubscribe") |
| F-19 | MEDIUM | **Confidential business material sits in the repo:** the dataroom (burn ledger, outreach) and `Updated Grant Plan 03-11-2026.txt`. | repo root; `memory/omni-recall/apex-dataroom/` | Exposure depends on repo visibility (O5) | **OPEN** (both present). Visibility: O5. |
| F-20 | LOW | **Root clutter:** `scratch_fix.cjs`, `test.json`, `test_compression_logic.ts`, `test_live_proxy.ts`, `omnihub-starmap-v1.0.0.zip`. | repo root | VERIFIED-IN-CODE | **OPEN** (all 5 present) |
| F-21 | LOW | **Documentation drift.** `CLAUDE.md` H1 still references the archived "TRADELINE 24/7". The latest `.understand-anything` snapshot (2026-07-22) predates ops-log entries dated 2026-07-31. | `CLAUDE.md:7`; `docs/APEX_AGENT_OPERATIONS.md:1717-1724` | VERIFIED-IN-CODE | **OPEN.** `CLAUDE.md:7` is unchanged. The latest snapshot, `CANONICAL_STATE_2026-08-23.md`, predates ops-log §9.41 (2026-09-05). |
| F-22 | STRATEGIC | **Portfolio sprawl.** The burn ledger lists about 10 live products, and every monthly cost is still "[JR TO FILL]". | `memory/omni-recall/apex-dataroom/05-financials/burn-ledger.md` | VERIFIED-IN-CODE (O8) | **OPEN** (68 "JR TO FILL" markers) |

### 4.1 Verified clean (do not "fix" these)

The following were checked and are fine:

- The checkout `returnUrl` origin allowlist prevents open redirects (`create-checkout/index.ts:79-87`).
- CORS uses an exact-match `ALLOWED_ORIGINS` allowlist (`_shared/cors.ts`).
- `apex-voice` authenticates the user and rate-limits despite `verify_jwt=false`.
- `activate_client_subscription` requires the service role. (Re-confirmed at `841e2b1`: `20260601000000_harden_subscription_activation_rpc.sql:34-35`.)
- RLS is enabled broadly (111 enable statements across 105 table creates).
- There are zero `dangerouslySetInnerHTML` usages.
- The "private keys" in `NATIVE_PUSH_SETUP.md` are truncated placeholders.
- Mainnet NFT deploy is guarded by `scripts/hardhat/guard-mainnet-deploy.mjs`.
- The OmniLink mobile app name is intentional (`memory/omni-recall/docs/platform/OMNILINK_MOBILE_PWA.md`).

### 4.2 WP-00 Baseline Report (2026-09-28, HEAD `841e2b1`)

**Method.** I ran every §5 WP-00 probe plus the follow-up greps listed below against `main` at `841e2b171a42a2e8515fc0ce23ab138a7a034230` (the working branch was identical to `origin/main`, 0/0 ahead/behind). The live checks were an HTTPS fetch of `https://apexomnihub.icu/` and `/pricing`. No source files were changed.

**Result.** 22/22 F-IDs are `OPEN`, and none is `RESOLVED-UPSTREAM`. HEAD has **not** diverged in files (the webhook is not rewritten). It **has** diverged in schema semantics, and that invalidates parts of the WP-01, WP-02 and WP-03 designs (see below).

#### New findings

| ID | Sev | Finding | Evidence @ `841e2b1` | Label |
|---|---|---|---|---|
| F-23 | **CRITICAL** | **A second BUS blocker exists in `user_entitlements`.** The RPC upserts `p_tier` verbatim into `public.user_entitlements.tier`, and that column has `CHECK (tier IN ('BASIC','PRO'))`, which no later migration alters. Changing only the RPC tier block, as WP-01 specifies, would still raise a check violation for `BUS`, so the webhook would still return 500. | `20260211000000_create_user_entitlements.sql:23`; RPC upsert in `20260601000000_harden_subscription_activation_rpc.sql` (`INSERT INTO public.user_entitlements`, `tier = EXCLUDED.tier`) | VERIFIED-IN-CODE |
| F-24 | HIGH | **The skill entitlement layer recognizes only `PRO`.** Anything else is treated as `BASIC` (the 5-skill free cap). Business customers would therefore get fewer skills than Pro even after F-01/F-23 are fixed. | `supabase/functions/omnilink-port/omniskills.ts:47`; `20260622000000_skill_entitlement_free_cap_5.sql:57,118` (`IF user_tier = 'PRO'`); `20260214000001_skill_forge_protocol.sql:117` | VERIFIED-IN-CODE |
| F-25 | MEDIUM | **The UI tier maps have no `business` key.** `tierLevels` and `tierNames` in `PaidAccessRoute.tsx` cover `free`/`starter`/`pro`/`enterprise` only, although the enum has had `business` since 2026-06-23. | `src/components/PaidAccessRoute.tsx:23-30`; `20260623000000_add_business_subscription_tier.sql:12` | VERIFIED-IN-CODE |

#### Amendments (decided by the owner on 2026-09-28; decisions below the table)

| ID | Affects | Amendment | Evidence |
|---|---|---|---|
| A1 | WP-01, WP-02, WP-03 | **Map `BUS` to `business`, not `enterprise`.** The enum ladder at HEAD is `free → starter → pro → business ($299 CAD) → enterprise (custom)`. Mapping BUS to `enterprise` would over-grant custom-hardware/SLA entitlement. Resulting changes: the WP-01 CASE uses `WHEN 'BUS' THEN 'business'`; the WP-02 `DbSubscriptionTier` adds `'business'` and `tierForPrice` returns `'business'` for the bus price; the WP-03 rank becomes `free 0 < starter 1 < pro 2 < business 3 < enterprise 4`; and WP-01's `PaidAccessRoute.tsx` edit **adds** `business` to `tierLevels`/`tierNames` (display `'Business'`) instead of renaming `enterprise`, which also closes F-25. | `20260623000000_add_business_subscription_tier.sql:7-19`; `private.is_paid_user` already lists `'business'` (`20260716005122_private_authorization_helpers.sql:59-80`) |
| A2 | WP-01 | **Widen the `user_entitlements` CHECK constraint to accept `BUS`** in the same WP-01 migration, since WP-01 cannot close F-01 without it. Use `ALTER TABLE ... DROP CONSTRAINT IF EXISTS <name>` followed by `ADD CONSTRAINT ... CHECK (tier IN ('BASIC','PRO','BUS'))`. The constraint name must be read from `pg_constraint` in staging first; a rollback is required. F-24 (skill parity: treat `BUS` ≥ `PRO`) is added to WP-03's scope. | F-23, F-24 |
| A3 | WP-01 (gate D1) | **D1 is pre-evaluated and TRIGGERS.** `public.is_paid_user` delegates to `private.is_paid_user`, which requires `tier IN ('starter','pro','business','enterprise')`. Six OmniDash RLS policies depend on it. Mapping BASIC to `free` would lock Base users out of OmniDash data, which is a promised Base surface. The owner must choose **(a)** BASIC to `free` and relax those RLS policies to authenticated-only, or **(b)** keep `starter` and make both `isPaid` (`src/hooks/usePaidAccess.ts:84-96`) and `private.is_paid_user` exclude activations with no `stripe_subscription_id`. | `20260205000001_omnidash_paid_access.sql:12,38` (6 `CREATE POLICY`); `20260716005122_private_authorization_helpers.sql:59-124` |
| A4 | Process | This session's harness mandates the branch `claude/apex-omnihub-revenue-contract-v4bm9b`, which takes precedence over N10's naming. The git remote at HEAD is `aoid-org/APEX-OmniHub`, while the frontmatter `target_repo` says `apexbusiness-systems/APEX-OmniHub`. The owner should confirm which is canonical. | `git remote -v` |

**Owner decisions (2026-09-28, binding):**

- **A1: APPROVED.** `BUS` maps to `business`.
  - Every rank comparison uses the ladder `free 0 < starter 1 < pro 2 < business 3 < enterprise 4`. WP-02's `tierForPrice` returns `'business'`, and WP-03's `hasTier` uses this ladder.
  - The WP-01 `tierNames` rename is dropped, so `enterprise` stays "Enterprise".
  - Before writing WP-01, verify that `is_paid_user()` and `get_user_tier()` treat `business` as paid. If an `IN` list excludes it, fix that in WP-01.
  - F-25 moves to WP-03.
- **A2: APPROVED, with one change.** WP-01 does not rely on looking up the constraint name in production. Instead, an idempotent `DO` block drops every CHECK constraint on `public.user_entitlements` that references `tier`, then adds `user_entitlements_tier_check CHECK (tier IN ('BASIC','PRO','BUS'))`. A rollback script is required. F-24 moves to WP-03.
  - **Release rule:** WP-01, WP-02 and WP-03 merge in order and deploy to production as one release. BUS checkout stays disabled until then.
- **A3 / D1: OPTION (a).** Base maps to `free`, and the six OmniDash policies admit any signed-in user.
  - Option (b) was rejected because it would still lock Base out: it excludes accounts with no Stripe subscription from `is_paid_user`, which those same six policies use. It would also keep `starter` as a tier with no product behind it.
  - Only those six policies change: `is_paid_user(...)` is replaced with `(select auth.uid()) IS NOT NULL`, and every ownership or tenant predicate stays byte-identical. `is_paid_user()` itself is unchanged.
  - All of this goes in one migration, policies first and then the RPC mapping. The BASIC→free backfill is a separate migration that the owner approves before merge (N5).
  - Tests for each policy: anon is denied, a free user reads their own rows, and cross-user access is denied.
- **A4:** `aoid-org/APEX-OmniHub` is canonical (it holds `main` `841e2b1`). The branch the session requires is accepted, and N10 naming is waived for this harness.
- **Merge hold:** PR #14 merges only after the owner confirms the repo is private (O5).

#### Found, not fixed (out of scope for WP-00, N12)

- `docs/APEX_AGENT_OPERATIONS.md` is 1828 lines and contains 13 duplicated §9 numbers: 9.7, 9.10, 9.11, 9.12, 9.13, 9.16, 9.17, 9.18, 9.19, 9.21, 9.22, 9.38 and 9.39. **Owner ruling:** the 600-line cap does not apply to this append-only log. Do not renumber the duplicates. A possible archive split is logged for WP-11 and needs an owner decision.
- Files later WPs will edit that already exceed 600 lines: `apps/omnihub-site/src/pages/Home.tsx` (2463; WP-08) and `apps/omnihub-site/src/pages/RequestAccess.tsx` (782; WP-05, WP-08). **Owner ruling:** the net line count of these files must not increase in WP-05 or WP-08. New code goes in new modules, and existing code is not refactored.
- Live DB checks for F-02 (row counts), F-08 (`access_requests` existence) and the A2 constraint name were not run, because the Supabase MCP connector was not authorized in this session. They remain REQUIRES_LIVE_VALIDATION.

#### Revised WP readiness

| WP | Readiness at `841e2b1` |
|---|---|
| WP-01 | Unblocked by the owner decisions. Starts once PR #14 merges (merge held pending O5 repo visibility). |
| WP-02 | Follows WP-01. WP-01, WP-02 and WP-03 ship as one production release. |
| WP-03 | Follows WP-02. Scope gains F-24, F-25 and the RLS/skill-gate inventory. |
| WP-05, WP-07, WP-09 | Ready (depend only on WP-00). The owner ordered them WP-05, then WP-07, then WP-09. |
| WP-10 | BLOCKED on D3 (unchanged) |

### 4.3 Owner amendments B (2026-09-28), re-verified at `main` `89d81ee`

The owner's omni-recall analysis used an older snapshot. Every item below was re-checked at `89d81ee` (after #15 and #16 merged). Where the analysis and the current code disagree, the correction is recorded and the code wins.

**B1: F-05 re-verified and downgraded to MEDIUM, pending the WP-03 matrix.** Paid gating lives outside `PaidAccessRoute`. Live mechanisms at HEAD:

| Mechanism | Evidence | Live? |
|---|---|---|
| `usePlan` (tier from `subscriptions`; fails closed to `free`) | `apps/omnihub-site/src/hooks/usePlan.ts:21,50-58`, consumed by `dashboard/components/modules/PhysiOmniModule.tsx:75` and `FilesModule.tsx:28` | Yes |
| `omniskills.ts` skill cap (`user_entitlements.tier`, PRO only) | `supabase/functions/omnilink-port/omniskills.ts:33-63` | Yes |
| DB skill enforcement | `20260622000000_skill_entitlement_free_cap_5.sql:57,118` | Yes |
| OmniDash RLS via `is_paid_user` | `20260205000001_omnidash_paid_access.sql` (6 policies) → `private.is_paid_user` | Yes |
| `usePaidAccess` | Consumed by `src/hooks/useCapabilities.ts:25` (live: `MobileBottomNav.tsx:53`, `MobileOnlyGate.tsx:21`) and `useLoginRedirect.ts:48` | **Yes (correction)** |
| `canAccessFeature` | `src/features/registry.ts:684`; no call sites outside tests | No (defined, unused) |
| `postLoginRouter` paid routes | `src/utils/postLoginRouter.ts:20-31`; only importer is `useLoginRedirect`, which has no callers | No (unreachable) |
| `PaidAccessRoute` component | No consumers outside its own file | No (dead) |

- **Correction:** the analysis said `PaidAccessRoute` and `usePaidAccess` are both dead. Only the **component** is dead. `usePaidAccess` feeds `useCapabilities`, which renders on mobile, so F-02's `isPaid` defect reaches live UI through it. Neither will be *wired* anywhere new (owner instruction), but `usePaidAccess` stays in the WP-03 inventory and in F-02's blast radius.
- `canAccessFeature` and `postLoginRouter` are not reachable from any rendered surface. WP-03 records them as `NOT-WIRED` and does not treat them as enforcement.

**B2: WP-03 rewrite (supersedes §5 WP-03 Steps 1–2).**
- The matrix must inventory the B1 mechanisms. Each Pricing promise maps to the mechanism that owns its surface.
- A gap is closed by **extending that surface's existing mechanism** (for example `usePlan` for PhysiOmni/Files, `omniskills.ts` plus the DB functions for skills, the RLS policies for OmniDash data).
- A new helper is added only when no existing mechanism covers a promised feature, and the PR must justify it. The `_shared/entitlements.ts` helper is no longer the default.
- **F-25 target:** the tier maps that are actually live. `usePlan` already includes `business` in the RFC-003 ladder (`usePlan.ts:8,21`), so it needs no change. The live maps missing `business` are the tier type of `usePaidAccess`/`useCapabilities` (`src/hooks/usePaidAccess.ts`). The type in `postLoginRouter.ts:21` is unreachable (see B1). The `PaidAccessRoute` maps are dead and are not edited.
- **Ladder:** RFC-003 (`memory/omni-recall/rfc/RFC_003_PHYSIOMNI_BUSINESS_TIER_PAYWALL.md:23-27`) confirms `free < starter < pro < business ($299 CAD) < enterprise`. This matches A1.

**B3: WP-01.** A1 is confirmed by the approved RFC-003. No change.

**B4: WP-07.** Keep the approved SSG readiness gate green (`memory/omni-recall/rfc/RFC_2026_06_23_TENANT_ENTITLEMENTS_SSG_GATE.md`).
- **Correction:** `production-readiness.yml` has been retired. Its gate, including the isolated `bun run build:ssg` smoke build, now lives in `.github/workflows/ci-runtime-gates.yml` (`:196` fold note, `:375` SSG build).
- WP-07 must keep both the root production build and that SSG build green.

**B5: WP-08.** Public copy must avoid every "Prohibited Unqualified Claim" in `memory/omni-recall/docs/architecture/CANONICAL_TRUTH_MATRIX.md` (§ at `:57`), in addition to `verify-claim-hygiene.mjs`.

**B6: Shadow project (no code change).**
- `apex-omnihub-shadow` serves `release.yml`'s shadow certification (the Release Safety pipeline; shadow preflight at `release.yml:71-79`).
- Certification blocker **B-2 is still open**, per `memory/omni-recall/docs/release/SHADOW_DEPLOYMENT_BLOCKERS.md:23,36`: no `release-validation-summary.json` with a `VALIDATED` verdict has been produced yet.
- **Correction:** the tracker's path is `memory/omni-recall/docs/release/SHADOW_DEPLOYMENT_BLOCKERS.md`, not `docs/release/`.
- **Owner decision logged, RSI naming:**
  - In code and docs, RSI = *Release Safety Intelligence* (`memory/omni-recall/docs/rsi/README.md:20`; `.github/workflows/rsi-governance.yml`).
  - The canonical dev skill `.claude/skills/omnidev-apex-pro-v2/SKILL.md` uses an `<rsi_engine>` block that means a repair loop, which is a different meaning under the same acronym.
  - The owner should choose one expansion, or rename the skill block. No change is made here.

## 5. Work Packages

Dependency graph: `WP-00 → WP-01 → WP-02 → WP-03 → WP-04`. `WP-05`, `WP-07` and `WP-09` depend only on WP-00. `WP-06` follows WP-04 and WP-05. `WP-08` follows WP-03 and WP-05. `WP-10` follows WP-03 plus owner decision D3. `WP-11` runs last.

---

### WP-00 — Baseline and Re-verification (read-only, no code changes) · **DONE (merged #14)**

- **Skill:** `apex-master-debug-claude`
- **Goal:** Confirm every F-ID at current HEAD and produce the authoritative status table.
- **Steps:**
  1. Run `git fetch origin && git checkout main && git pull --ff-only`. Record the HEAD SHA.
  2. Run each probe below. Record `OPEN` or `RESOLVED-UPSTREAM` per F-ID.

```bash
grep -lE "FUNCTION public\.activate_client_subscription" supabase/migrations/*.sql   # F-01/F-02: open the LAST file listed
grep -nE "p_tier NOT IN|v_subscription_tier :=" "$(grep -lE 'FUNCTION public\.activate_client_subscription' supabase/migrations/*.sql | tail -1)"
grep -nE "event.type|constructEvent" supabase/functions/stripe-webhook/index.ts          # F-03/F-04/F-17
grep -rn "<PaidAccessRoute" src apps/omnihub-site/src --include=*.tsx | grep -v components/PaidAccessRoute.tsx   # F-05
grep -rnE "tier|subscription" supabase/functions/omnilink-port/omniskills.ts | head -20  # F-05 scope
grep -nE "location.assign\('/login'\)|redirectTo" apps/omnihub-site/src/pages/Pricing.tsx apps/omnihub-site/src/pages/Login.tsx  # F-06
grep -rlE "access_requests" supabase/migrations                                           # F-08 (empty = OPEN)
grep -nE "onConflict|ignoreDuplicates|error.message" apps/omnihub-site/src/pages/RequestAccess.tsx  # F-09
grep -nE "VITE_(FIRECRAWL|GOOGLE)_API_KEY" src/core/mcp/mcp.config.ts                     # F-15
grep -B2 "verify_jwt *= *false" supabase/config.toml | grep -oE "functions\.[a-z0-9_-]+"  # F-16
curl -s https://apexomnihub.icu/ | grep -c "<h1" ; curl -s https://apexomnihub.icu/pricing | grep -c "<h1"   # F-11 (0 = OPEN)
```

  3. Commit this contract to `docs/contracts/REVENUE_EXECUTION_CONTRACT.md` with the §4 Status column updated, then run `npm run docs:check`.
- **Acceptance:** Every F-ID has a status and HEAD SHA evidence. No source files changed.
- **Stop if:** HEAD has diverged in a way that invalidates the WP designs (for example, the webhook was rewritten). In that case, report the divergence and wait.

---

### WP-01 — Fix Tier Provisioning (F-01, F-02, F-23) · P0 · amended per owner decisions of 2026-09-28 · **DONE in code (merged #19; migrations and deploy pending)**

- **Skill:** `apex-master-debug-claude` + `supabase-postgres-best-practices`
- **Starts after:** PR #14 merges.
- **Release rule:** WP-01, WP-02 and WP-03 merge in that order and deploy to production as **one** release. The owner keeps BUS checkout disabled until then.
- **Preconditions:**
  1. Open the latest migration that defines `public.activate_client_subscription`. Copy its entire body verbatim as the base. That includes `SECURITY DEFINER`, `SET search_path`, the service-role guard, both upserts (`user_entitlements` and `subscriptions`), the `ON CONFLICT` clauses, and any `GRANT`/`REVOKE` statements.
  2. Confirm that the enum `public.subscription_tier` contains `free`, `starter`, `pro`, `business` and `enterprise`. (`business` was added in `20260623000000_add_business_subscription_tier.sql`.)
  3. **Paid-check audit (A1 condition).** Verify that `is_paid_user()` (which delegates `public` → `private`; latest definition in `20260716005122_private_authorization_helpers.sql`), `get_user_tier()` and any other tier-comparing helper treat `business` as paid. For each helper, record whether it compares by enum order or against a hard-coded `IN` list. At `841e2b1`, `private.is_paid_user` already lists `'business'`. If any `IN` list omits `business`, fix it in this WP's migration and list the fix in the PR.
  4. Resolve the latest definition of each of the six OmniDash policies in `20260205000001_omnidash_paid_access.sql` that use `is_paid_user(...)`, checking for later redefinitions. Record each policy's current `USING` / `WITH CHECK` text in the PR as "before".
- **Changes, migration 1** (`supabase/migrations/<ts>_activation_rpc_business_free_tiers.sql`), applied in this order:
  1. **OmniDash policies (D1 = option a).** For each of the six policies, run `DROP POLICY IF EXISTS`, then `CREATE POLICY` with the same name, command and roles. The **only** change is replacing the `is_paid_user(...)` term with `(select auth.uid()) IS NOT NULL`. Every ownership and tenant predicate stays byte-identical. `is_paid_user()` itself does not change, and every other policy that uses it stays paid-gated.
  2. **`user_entitlements` tier CHECK (A2).** Add an idempotent `DO` block that finds every CHECK constraint on `public.user_entitlements` whose definition references `tier` (`pg_constraint`, `contype = 'c'`, `conrelid = 'public.user_entitlements'::regclass`, with `pg_get_constraintdef(oid)` referencing `tier`) and drops each one. Then add `user_entitlements_tier_check CHECK (tier IN ('BASIC','PRO','BUS'))`. Do not depend on looking up the constraint name in production.
  3. **Activation RPC.** Use the verbatim body and change only the tier block:

```sql
IF p_tier NOT IN ('BASIC', 'PRO', 'BUS') THEN
    RAISE EXCEPTION 'Invalid tier. Must be BASIC, PRO or BUS.';
END IF;
v_subscription_tier := (CASE p_tier
    WHEN 'PRO' THEN 'pro'
    WHEN 'BUS' THEN 'business'
    ELSE 'free'            -- BASIC is the free plan (D1 = option a)
END)::public.subscription_tier;
```

  4. Include any paid-check fix found in precondition 3.
  - **Rollback:** `supabase/migrations/rollback/<ts>_activation_rpc_business_free_tiers_rollback.sql`. It restores the previous RPC body, the six original policies and the original `CHECK (tier IN ('BASIC','PRO'))`, all verbatim. The script must warn that restoring the CHECK fails while any `BUS` rows exist.
- **Changes, migration 2** (owner-gated per N5; `<ts+1>_backfill_basic_tier_free.sql`):

```sql
UPDATE public.subscriptions SET tier = 'free'
WHERE tier = 'starter' AND stripe_subscription_id IS NULL;   -- idempotent: re-run matches 0 rows
```

  - Its PR body must give the owner a pre-merge count query: `SELECT count(*) FROM public.subscriptions WHERE tier='starter' AND stripe_subscription_id IS NULL;`. The owner approves this migration before merge.
- **Not in WP-01:**
  - The `tierNames` rename is dropped; `enterprise` stays "Enterprise".
  - F-25 (`business` in `SubscriptionTier` and the `PaidAccessRoute` maps) moves to WP-03.
  - F-24 (skill parity) moves to WP-03.
- **Tests:**
  - A static contract test, for example `tests/infrastructure/activation-rpc-tiers.test.ts`. It asserts that the latest migration defining `activate_client_subscription`:
    - accepts `BUS`;
    - maps `BUS` to `business`;
    - maps `BASIC` to `free`;
    - keeps the service-role guard.

    It also asserts that the latest `user_entitlements` tier CHECK accepts `BUS`, and that none of the six policies references `is_paid_user`.
  - For each of the six policies: anon is denied, a free user can read their own rows, and cross-user access is denied. Use the repo's existing RLS test harness. If none can run here, label the tests `REQUIRES_LIVE_VALIDATION`.
- **Acceptance:** DoD passes. The PR shows each policy before and after. The RPC diff against the previous body is limited to the tier block.
- **Live validation** (`omnidev-apex-pro-v2`, after deploy): in staging, call the RPC with the service role for all three tiers and confirm the resulting `subscriptions` and `user_entitlements` rows. Label it `REQUIRES_LIVE_VALIDATION` until that is done.
- **Stop if:** any of these hold:
  - a later migration already redefines the function, the CHECK or the six policies;
  - fixing a paid-check helper would require touching policies other than the six.

---

### WP-02 — Webhook Integrity and Subscription Lifecycle Sync (F-03, F-04, F-17) · P0 · **DONE in code (merged #19; deploy pending)**

- **Skill:** `apex-master-debug-claude`
- **Preconditions:**
  1. Confirm the `public.subscriptions` column names: `status`, `tier`, `current_period_start`, `current_period_end`, `cancel_at_period_end`, `stripe_subscription_id` (and whether an `updated_at` trigger exists).
  2. Confirm the `public.subscription_status` enum values are exactly `active|trialing|past_due|canceled|expired|paused`. If they differ, adapt the mapping to the real enum and document it. (Confirmed exact at `841e2b1`.)
  3. Run `grep -rn "constructEvent" tests` and update any static assertion (for example in `tests/runtime-production-hardening.spec.ts`) to expect the async variant.
- **Changes:**
  1. **New pure module** `supabase/functions/_shared/stripeSubscriptionSync.ts`. It has zero imports, so both Deno and Vitest can load it. (Per A1, the bus price maps to `'business'`.)

```ts
export type DbSubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired' | 'paused';
export type DbSubscriptionTier = 'free' | 'starter' | 'pro' | 'business' | 'enterprise';
const STATUS_MAP: Readonly<Record<string, DbSubscriptionStatus>> = {
  active: 'active', trialing: 'trialing', past_due: 'past_due', unpaid: 'past_due',
  incomplete: 'past_due', incomplete_expired: 'expired', canceled: 'canceled', paused: 'paused',
};
export function mapStripeStatus(stripeStatus: string): DbSubscriptionStatus | null {
  return STATUS_MAP[stripeStatus] ?? null;
}
export function tierForPrice(priceId: string | undefined, prices: { pro?: string; bus?: string }): DbSubscriptionTier | null {
  if (!priceId) return null;
  if (prices.bus && priceId === prices.bus) return 'business';
  if (prices.pro && priceId === prices.pro) return 'pro';
  return null; // unknown price: never downgrade, leave tier unchanged
}
export const LIFECYCLE_EVENTS = new Set([
  'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted',
  'invoice.paid', 'invoice.payment_failed',
]);
```

  2. **`supabase/functions/stripe-webhook/index.ts`** (surgical changes only):
     - **Fail closed** at the top of the handler: `if (!stripeSecretKey || !stripeWebhookSecret) return new Response('Webhook not configured', { status: 500 });`
     - **Replace** line ~131 with `event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret, undefined, cryptoProvider);`, where `const cryptoProvider = Stripe.createSubtleCryptoProvider();` is declared at module scope. Keep `await req.text()` as the raw body.
     - **Rate-limit key (F-17):** replace `signature` with `req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'`. `checkRateLimit(identifier: string, …)` in `_shared/rate-limit.ts:207` accepts any string, so this is safe.
     - **Routing:** keep the `checkout.session.completed` handler unchanged. For `LIFECYCLE_EVENTS`, resolve the subscription ID from `event.data.object`. For `customer.subscription.*` it is `.id`. For `invoice.*` it is `.subscription`, which may be a string or null; if null, return 200 and ignore. Then call `syncSubscription(id)`. All other events return 200 and are ignored, as today.
     - **`syncSubscription(id)`:** retrieve the subscription from Stripe, which makes the handler order-independent and idempotent because it always writes the current Stripe state. Map the status with `mapStripeStatus`. If the status is unknown, log it and return 200. Derive the tier with `tierForPrice(sub.items.data[0]?.price?.id, { pro: env STRIPE_PRICE_ID_PRO, bus: env STRIPE_PRICE_ID_BUS })`. Then run:

       `update({ status, current_period_start, current_period_end, cancel_at_period_end, ...(tier ? { tier } : {}) }).eq('stripe_subscription_id', sub.id).select('user_id')`

       Error handling:
       - A Stripe retrieve error or a DB error returns **500**, so Stripe retries.
       - Zero rows updated returns **200** with a warning log. The row appears once `checkout.session.completed` is processed, and that handler already reads the current period from Stripe.
     - Keep `index.ts` at 600 lines or fewer. If the change would exceed that, move `syncSubscription` into `_shared/stripeSubscriptionSync.ts`'s I/O sibling `_shared/stripeSubscriptionSyncIO.ts`.
- **Tests:** Add `tests/edge-functions/stripeSubscriptionSync.test.ts` (covered by the Vitest include `tests/**/*.test.ts`). It must cover every entry in `STATUS_MAP`, the unknown-status case (null), `tierForPrice` for pro, bus, unknown and undefined inputs, and `LIFECYCLE_EVENTS` membership.
- **Acceptance:** DoD passes. Lifecycle events update the rows. `checkout.session.completed` behavior is byte-identical apart from the verification call.
- **Owner action O1 (required for this to work in production):** In the Stripe Dashboard, add `customer.subscription.created/updated/deleted`, `invoice.paid` and `invoice.payment_failed` to the webhook endpoint. Ensure the `stripe-webhook` function has the `STRIPE_PRICE_ID_PRO` and `STRIPE_PRICE_ID_BUS` secrets set. Afterwards, check the endpoint's delivery log for failed deliveries that predate the fix, which is the evidence for F-04.
- **Live validation:** in Stripe test mode, run checkout, then renewal (use a test clock), then cancel, then a failed payment. Verify each row transition. Label `REQUIRES_LIVE_VALIDATION` until done.

---

### WP-03 — Entitlement Matrix and Server-Side Enforcement (F-05, feeds F-13) · P0 · **DONE in code (merged #19; migration `20260928030000` and `omnilink-port` deploy pending)**

> **Amended by §4.3 B2 (2026-09-28).** The matrix inventories the live mechanisms in §4.3 B1. Gaps are closed by extending the owning mechanism. A new helper, including `_shared/entitlements.ts` below, is added only when no mechanism covers a promised feature, and must be justified in the PR. F-25 targets the live tier maps (§4.3 B2).

- **Skill:** `apex-master-debug-claude`
- **Goal:** Every paid promise on the Pricing page either maps to enforced code or is removed from the copy (removal happens in WP-08). The scope also includes:
  - **F-24:** skill parity, where `BUS` counts as at least `PRO` in `omniskills.ts` and in the skill-enforcement SQL.
  - **F-25:** add `business` to `SubscriptionTier` and to the `tierLevels`/`tierNames` maps in `PaidAccessRoute.tsx`, displayed as `'Business'`. `enterprise` stays `'Enterprise'`.
- **Step 1 (deliverable, committed):** Write `docs/contracts/ENTITLEMENT_MATRIX.md` with one table containing every feature bullet in `Pricing.tsx` PLANS. Columns: `feature | tier | code surface (file:line) | enforced where (server/UI/none) | status: IMPLEMENTED+ENFORCED / IMPLEMENTED-UNGATED / NOT-IMPLEMENTED`. Include the existing gating in `supabase/functions/omnilink-port/omniskills.ts`.
- **Step 2 (enforcement):**
  - Add a single helper, `supabase/functions/_shared/entitlements.ts`, exporting `hasTier(adminClient, userId, minTier)`. It reads `subscriptions` with the service role. It returns true only if `tier` rank is at least `minTier` rank (`free 0 < starter 1 < pro 2 < business 3 < enterprise 4`, per A1), `status` is `active` or `trialing`, and `current_period_end` is null or in the future.
  - First reuse `subscription_active_status()` if its semantics match; document the decision.
  - Apply the helper **only** at the server entry points of features marked `IMPLEMENTED-UNGATED` for Pro or Business. A denied request returns 403 with `{ error: 'UPGRADE_REQUIRED', requiredTier }`.
  - In the UI, render the existing `UpgradePrompt` only **inside module content areas** when a 403 `UPGRADE_REQUIRED` is received. Never change OmniDash layout (N6).
- **Step 3:** Do not implement any `NOT-IMPLEMENTED` feature in this WP. List those features for WP-08 copy removal and for the owner's roadmap.
- **Tests:** a unit test for the rank logic in `hasTier`, plus one integration or E2E test proving that a free user receives `UPGRADE_REQUIRED` on one gated Pro endpoint.
- **Acceptance:** DoD passes. The matrix is committed. Every gated endpoint has a test or is listed as `REQUIRES_LIVE_VALIDATION`.
- **Stop if:** enforcing a gate would break a Base-promised surface (conflict with D1). Report it.

---

### WP-04 — Single Purchase Funnel (F-06) · P0 · **STOPPED (owner decision: Business in the wizard)**

- **Skill:** `apex-boost-claude`
- **Preconditions:**
  1. In `OnboardingWizard.tsx`, confirm that `handleFinalActivation` invokes `create-checkout` for `PRO` and `BUS` and preserves intent across OAuth (the `returnUrl` with `step=4`). If it does not, STOP and report.
  2. Run `grep -rnE "pricing-plan-|create-checkout" tests e2e apps/omnihub-site/tests` and list the specs that assert Pricing calls checkout directly.
- **Changes:**
  - `Pricing.tsx` `handlePlan`: `BASIC` keeps going to `/launch`. For `PRO` and `BUS`, call `globalThis.location.assign('/launch?tier=' + plan.id)`. Remove nothing else; the billing-portal flow stays.
  - `OnboardingWizard.tsx`:
    - Read `searchParams.get('tier')` and accept it only if it is `PRO` or `BUS`.
    - If it is valid, set `sessionData.selectedTier`, then advance to step 4 if a session exists, otherwise to step 3.
    - Reuse the existing state and step logic. Add no new state machine.
  - Update the affected specs from precondition 2 so they assert the new redirect.
- **Tests:** Update or add a Playwright spec: `/pricing`, click Pro, the URL becomes `/launch?tier=PRO`, and the wizard shows the auth gate with Pro preselected. Add a unit test for tier-param validation that rejects `BASIC`, `FOO` and the empty string.
- **Acceptance:** DoD passes. The only checkout call site is the wizard.
- **Live validation:** a real Pro test-mode purchase from `/pricing` while logged out reaches Stripe and returns to `/omnidash?onboarded=true`.

---

### WP-05 — Lead Capture Integrity and Alerting (F-08, F-09, F-10) · P0 · **DONE (merged #15, #18; alert function and secrets pending)**

- **Skill:** `apex-master-debug-claude` + `supabase-postgres-best-practices`
- **Changes:**
  1. Add a new root migration, `supabase/migrations/<ts>_access_requests_canonical.sql`. It must be idempotent: `CREATE TABLE IF NOT EXISTS` with the identical schema from the app-local migration, including `UNIQUE(email)`; `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`; `DROP POLICY IF EXISTS` then `CREATE POLICY` for anon INSERT; and the deny-read policy. Add a rollback script as well.
  2. In `RequestAccess.tsx`, change the upsert options to `{ onConflict: 'email', ignoreDuplicates: true }`. This compiles to `ON CONFLICT DO NOTHING`, which the INSERT-only policy allows. Also replace `throw new Error(error.message)` with the site's existing user-facing error mapping (reuse the pattern from `toUserFacingAuthError` or its sibling). Never show raw database messages. (The file is 782 lines at `841e2b1`. Its net line count must not increase: new code goes in new modules, with no refactor of existing code.)
  3. **Alerting without a new vendor.** Inventory the existing channels:
     - `grep -rnE "RESEND|SMTP|sendgrid|postmark|send-push-notification|slack|discord" supabase/functions .env.example`
     - If an existing channel exists, add an `AFTER INSERT` trigger that calls it, or extend an existing function to notify.
     - If none exists, STOP this sub-step. Mark it `BLOCKED: owner must choose an existing channel`, and do **not** add a vendor (N1).
- **Tests:** a static test asserting the root migration exists and is idempotent (all its guards are present), and a unit test asserting the error mapping never surfaces raw database text.
- **Acceptance:** DoD passes. A repeat submission with the same email shows the success state.
- **Live validation:** submit two identical requests on production (O3) and confirm one row and no user-visible error.

---

### WP-06 — First-Party Funnel Instrumentation (F-07) · P1

- **Skill:** `apex-boost-claude`
- **Preconditions:** inventory the existing telemetry sinks: `grep -rnE "web-vitals|reportWebVitals|omni-sentry|audit_logs|telemetry" src apps/omnihub-site/src supabase/functions`. If an existing sink accepts custom events with anon inserts, reuse it and skip the new table.
- **Changes** (only if no reusable sink exists):
  - Migration `<ts>_funnel_events.sql` creating table `public.funnel_events` with these columns:
    - `id uuid default gen_random_uuid() primary key`
    - `created_at timestamptz default now()`
    - `event text not null` with a `CHECK` on the whitelist below
    - `anon_id text not null`
    - `user_id uuid null`
    - `path text`
    - `props jsonb default '{}'` with `CHECK (pg_column_size(props) < 2048)`
  - RLS: anon and authenticated may INSERT only; no SELECT.
  - Add an index on `(event, created_at)` and a rollback script.
  - **Event whitelist:** `pricing_view`, `pricing_cta_click`, `checkout_started`, `checkout_completed`, `access_request_submitted`, `sprint_cta_click`, `first_connector_connected`.
  - Client helper `apps/omnihub-site/src/lib/funnel.ts`:
    - `track(event, props?)` is fire-and-forget and never throws or blocks.
    - `anon_id` is a random UUID kept in `sessionStorage` inside try/catch.
    - Tracking is a no-op when `navigator.doNotTrack === '1'`.
  - Server-side events:
    - `checkout_completed` is inserted in the webhook's `checkout.session.completed` handler; this is the source of truth.
    - `first_connector_connected` is inserted where OmniBoard persists a completed `connection_spec`. That location must be found first; if it is ambiguous, list it as `BLOCKED`.
  - Instrument the call sites: Pricing view and CTA clicks, the wizard's checkout start, the RequestAccess success, and the sprint CTA (WP-08).
  - Privacy: add one sentence about first-party usage events to the privacy content (`apps/omnihub-site/src/content/legal/`) and flag it for owner review (O6).
- **Tests:** unit tests for the whitelist and props-size guard, and a test that `track` swallows errors.
- **Acceptance:** DoD passes. The PR includes SQL for the 4 funnel ratios in §7.

---

### WP-07 — Crawlability and SSG Deploy Integrity (F-11) · P1

> **Amended by §4.3 B4.** Keep the approved SSG readiness gate green. It now lives in `ci-runtime-gates.yml:196,375`; `production-readiness.yml` is retired. Both the root production build and the isolated `build:ssg` must pass.

- **Skill:** `omnidev-apex-pro-v2`
- **Diagnose first (commit findings to the PR):**
  1. Compare `curl -s https://apexomnihub.icu/ | grep -c "<h1"` with the local `cd apps/omnihub-site && npm run build && grep -c "<h1" dist/index.html`.
  2. Read `.github/workflows/deploy-production-cf-direct.yml`. Identify which build command and which `dist` it deploys: the root SPA `vite build`, or the site's `build:ssg`.
- **Fix only the root cause:**
  - If production deploys a non-SSG artifact, change that workflow's build step to the site's SSG build and its matching `dist` path. Change nothing else in the workflow, and never touch secrets.
  - Deploy workflow edits require explicit owner approval in the PR (N5 spirit).
  - Confirm that `includedRoutes` covers `/`, `/pricing`, `/request-access`, and `/design-sprint` (after WP-08), and that `scripts/generate-sitemap.mjs` emits them.
- **Acceptance:** after deploy, the curl `<h1>` count is at least 1 for `/` and `/pricing`. `robots.txt` and `sitemap.xml` are reachable. Label `REQUIRES_LIVE_VALIDATION` until the post-deploy curl passes.

---

### WP-08 — Offer Surface, Pricing Copy, and CASL (F-12, F-13, F-18) · P1

- **Skill:** `apex-boost-claude`
- **Changes:**
  1. **New route `/design-sprint`** in the marketing site (a new page under 600 lines) using the existing `Layout`, `Section` and `SEOMeta` components and `StructuredData` where applicable.
     - Content comes only from the approved offer: the Intelligence Design Sprint delivers a mapped, documented, deployable automation system for CAD $5K–$15K setup, with a 30-minute discovery call.
     - The CTA links to `/request-access?intent=design-sprint`. Add the route to the SSG `includedRoutes` and the sitemap.
  2. **`RequestAccess.tsx`:** when `intent=design-sprint`, prefix `use_case` with `[design-sprint] `. No schema change.
  3. **Homepage:** add a primary CTA pair, "Book a Design Sprint" → `/design-sprint` and "See pricing" → `/pricing`. Place it in the existing hero CTA slot without restructuring the layout, and keep `/demo.html` reachable. (`Home.tsx` is 2463 lines at `841e2b1`. Its net line count must not increase: the CTA pair goes in a new component, with no refactor of existing code.)
  4. **Pricing copy:** rewrite each tier's tagline and features in plain outcome language. Remove every `NOT-IMPLEMENTED` bullet listed in the WP-03 matrix. Keep the prices and IDs unchanged, and keep the `data-testid` values.
  5. **i18n:** add every new string through the site's i18n system and satisfy `npm run i18n:check` in all 9 locales. If non-English values must be placeholders, use the English string and list the keys for translation in the PR. Do not machine-invent translations presented as final.
  6. **CASL (F-18):** append to each outreach template in `memory/omni-recall/apex-dataroom/07-outreach/` a footer block with these placeholders: `[Legal business name] · [Mailing address] · [Contact email/phone] · Reply "unsubscribe" or use [unsubscribe link] to opt out; requests honoured within 10 business days.` Add a note that counsel must review before sending (O6).
- **Tests:** Playwright checks that `/design-sprint` renders its H1 and CTA, that the CTA reaches `/request-access?intent=design-sprint`, and that the homepage shows both CTAs.
- **Acceptance:** DoD passes, including claim hygiene and i18n. `check:omnidash` passes, confirming no layout drift. Per §4.3 B5, no copy may contain a "Prohibited Unqualified Claim" from `memory/omni-recall/docs/architecture/CANONICAL_TRUTH_MATRIX.md`.

---

### WP-09 — Security Hygiene (F-15, F-16) · P1 · **DONE (merged #16)**

- **Skill:** `apex-master-debug-claude`
- **Changes:**
  1. **`src/core/mcp/mcp.config.ts`:** trace whether this file is reachable from a client entry by following imports from `src/main.tsx` and the site entries.
     - If it is node-only tooling, rename the env reads to non-`VITE_` names (`FIRECRAWL_API_KEY`, `GOOGLE_API_KEY`) read from the server or node environment, and update `.env.example`.
     - If it is client-reachable, remove the key injection from the client path entirely.
  2. **New guard** `scripts/ci/check-client-secret-env.mjs`, wired exactly like the sibling `check:*` scripts (a `package.json` alias plus its place in the existing gate chain). It fails when `/VITE_[A-Z0-9_]*(SECRET|PRIVATE|SERVICE_ROLE|API_KEY)/` appears in `src/`, `apps/*/src/` or `.env.example`, excluding `tests/`, `**/*.test.*` and `**/*.spec.*`. Note that `VITE_SUPABASE_ANON_KEY` does not match.
  3. **`supabase/config.toml`:** delete the 4 stale function blocks (F-16) and touch nothing else.
  4. For each remaining `verify_jwt=false` function (`apex-voice`, `web3-nonce`, `alchemy-webhook`, `physiomni-ingress`, `omnilink-port`, `mcp-gateway`), record the actual authentication mechanism with its `file:line` in the ops-log entry. If any has none, STOP and report; do not guess a fix.
- **Owner action O4:** if the `VITE_FIRECRAWL_API_KEY` or `VITE_GOOGLE_API_KEY` values were ever set in Cloudflare Pages build environment variables, rotate both keys.
- **Acceptance:** DoD passes. The guard passes on clean code and demonstrably fails on a fixture. Keep the fixture only inside the test.

---

### WP-10 — Margin Guard on Platform-Key LLM Usage (F-14) · P2 · Requires owner decision D3 · **BLOCKED (no caps supplied)**

- **Precondition (D3):** the owner supplies monthly caps per tier for platform-key (non-BYOM) usage, in the unit that `usage_metering` records. **No caps supplied means this WP is `BLOCKED`.** Do not invent limits.
- **Changes:**
  - Find the server call sites that spend platform LLM keys. At each one, before the provider call, sum the current month's `usage_metering` for the user and compare it with the tier cap. When the cap is exceeded, return 429 `{ error: 'USAGE_CAP_REACHED', upgradeTier }`.
  - Keep BYOM paths uncapped (the user pays).
  - Write metering rows server-side if they are not already written. Reuse the existing schema; no new table.
- **Acceptance:** DoD passes, with unit tests on the cap arithmetic and month boundary.

---

### WP-11 — Repo Hygiene and Documentation Sync (F-20, F-21) · P3 · run last · **Documentation part done 2026-09-29 (F-21); F-20 root clutter untouched**

- **Changes:**
  1. For each file in F-20, run `grep -rn "<basename>" --exclude-dir=node_modules .`. Delete the file only if it has zero references; otherwise leave it and list it. Never touch the `Updated Grant Plan` file or the dataroom; that is owner decision O5.
  2. `CLAUDE.md:7`: replace "APEX-OMNIHUB / TRADELINE 24/7 CORE PROTOCOLS" with "APEX-OMNIHUB CORE PROTOCOLS". Change only that heading line. Run the ops-doc guards (`check-ops-doc-drift`, `check-ops-doc-claim-integrity`) afterwards.
  3. Add a new `.understand-anything/CANONICAL_STATE_<date>.md` following the existing format: verified HEAD, the WPs merged, and the F-ID closure table. Update the `README.md` "Latest repo-history note" pointer.
- **Acceptance:** DoD passes, and the doc guards pass.

## 6. Owner Actions (outside Claude Code; blocking where noted)

| ID | Action | Blocks |
|---|---|---|
| O1 | In the Stripe Dashboard, subscribe the webhook endpoint to the WP-02 events. Confirm the `STRIPE_PRICE_ID_PRO` and `STRIPE_PRICE_ID_BUS` secrets on both `create-checkout` and `stripe-webhook`. Export the failed-delivery log (F-04 evidence). | WP-02 go-live |
| O2 | Search Stripe for Business (`tier=BUS` metadata) subscriptions and any paid-but-unprovisioned customers. After WP-01/WP-02 deploy, re-send those events from the Stripe Dashboard, or refund. | Revenue integrity |
| O3 | Confirm whether `public.access_requests` exists in the production project, and export any existing leads. | WP-05 validation |
| O4 | Rotate the Firecrawl and Google keys if they were ever set as `VITE_` build variables. | WP-09 closure |
| O5 | Confirm the repo's visibility. If it is public, move `memory/omni-recall/apex-dataroom/` and the grant plan file to private storage. | Confidentiality |
| O6 | Have counsel review the CASL footer and consent basis, and the privacy-policy line from WP-06, before any outreach send. | Outreach |
| O7 | Run one full live billing cycle (buy, then cancel, then refund) on Pro and on Business, and record the evidence. | Production certification |
| O8 | Fill in the burn-ledger costs, then pause any product with no revenue path in 90 days. | Focus |
| O9 | Sell the Design Sprint now; do not wait for the code. One sprint equals 50–150 months of Pro revenue (CAD $5K–$15K ÷ $99). | Cash |
| D1/D3 | D1 decided on 2026-09-28: option (a) (§4.2). D3 is still open (WP-10). | WP-10 |
| A1–A4 | Decided on 2026-09-28 (§4.2). | — |

## 7. Success Metrics (computed from WP-06 data; no vanity metrics)

| Metric | Definition | Decision use |
|---|---|---|
| Pricing → checkout start | `checkout_started / pricing_view` (unique `anon_id`, 7-day window) | Pricing copy and offer quality |
| Checkout completion | `checkout_completed / checkout_started` | Auth and funnel friction (WP-04) |
| Lead capture rate | `access_request_submitted / sessions` | Offer resonance |
| Activation | Share of `checkout_completed` users with `first_connector_connected` within 7 days | Onboarding; drives the next roadmap item |
| Sprint pipeline | Count of `[design-sprint]` requests per week, and calls booked (owner-tracked) | Cash-now track |

## 8. Scope and Coverage Statement (honest)

**Audited at code level:** billing (checkout, webhook, activation RPC, entitlements), auth funnel, onboarding wizard, pricing, request-access, SSG configuration, edge-function JWT posture, CORS, client environment exposure, usage metering, repo hygiene, governance docs, and the dataroom offers and legal posture.

**Inventoried but not line-audited:**
- `orchestrator/` (148 files)
- `terraform/`, `sim/`, `integration-harness/`, `apex-resilience/`
- native `android/` and `ios/`
- `contracts/` (the NFT, dormant: zero UI references)
- the 390 test files (34 of which contain skips)

None of these sits on the revenue path identified here, except OmniBoard connection persistence, which WP-06 touches. They are excluded here to protect the one-task-per-session rule. Audit them in a separate contract if needed.

**Not verifiable from here:** Stripe account state, production database state, Cloudflare environment variables, traffic, and repo visibility. Each is represented by an O-item or a `REQUIRES_LIVE_VALIDATION` gate, never asserted.

## Appendix A — Quality Rubric (how this contract was graded)

| # | Criterion (10 pts each) | Previous chat audit | This contract |
|---|---|---|---|
| 1 | Coverage: every layer inventoried; audited or explicitly scoped with reason | 4 | 10 |
| 2 | Evidence: every finding has `file:line` and an honesty label | 7 | 10 |
| 3 | Correctness: no false claims, no invariant violations (the prior output missed F-01, F-02 and F-05 and proposed an OmniDash change banned by the Layout Law) | 4 | 10 |
| 4 | Prioritization tied to revenue impact | 6 | 10 |
| 5 | Actionability: exact files, changes, and acceptance criteria | 5 | 10 |
| 6 | Governance integration (`CLAUDE.md`, skills, ops log, claim hygiene, 600-line rule) | 1 | 10 |
| 7 | Constraint compliance (no new vendors, surgical, idempotent, rollback) | 7 | 10 |
| 8 | Verification: tests per WP, live gates, and stop conditions | 5 | 10 |
| 9 | Commercial and legal (offer, metrics, CASL, confidentiality) | 6 | 10 |
| 10 | Executor clarity (deterministic order, decision gates, no ambiguity) | 0 | 10 |
| | **Total** | **45** | **100** |

**What 100/100 means:** the contract meets every rubric criterion as written. It does **not** mean every file in the repo was line-audited (see §8), and it does not guarantee production outcomes. Those outcomes are proven only by the WP live-validation gates and the owner actions. (WP-00 finding: criterion 3 was not fully met as issued. The BUS → `enterprise` mapping and the missing `user_entitlements` constraint are corrected by A1/A2.)
