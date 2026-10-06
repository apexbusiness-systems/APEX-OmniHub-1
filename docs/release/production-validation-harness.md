# APEX-OmniHub Production Validation Harness — 2026-06-26

## Executive decision boundary

This harness supports a truthful production-certification decision for `https://apexomnihub.icu`. It is intentionally non-destructive by default. It does **not** certify production by its existence; each release-critical item is certified only when the matrix item is `VERIFIED` with retained evidence.

Current status (corrected 2026-09-29 to match `docs/release/release-validation-matrix.json`, the authority): the matrix decision is `GO_FOR_FULL_PRODUCTION_CERTIFICATION` with **19 of 20 items `VERIFIED`** with live evidence (Cloudflare provenance, authenticated workflows, Supabase RLS, BYOM, billing sandbox, mobile/device, performance/load, branch protection and the rest). **`REQUEST_ACCESS_PROOF` is `HONESTLY_GATED`**: backend persistence of a submitted lead has not been proven (`backendPersistenceProven: false`; it needs an explicit test write with `APEX_REQUEST_ACCESS_WRITE_OK=true`). Do not claim Request Access persistence as verified. Context: production builds compiled the server-side lead insert out until 2026-09-28 (`docs/APEX_AGENT_OPERATIONS.md` §9.50), so an earlier reading of this line as "persistence verified" was not supported by the evidence. The September 2026 changes are not covered by this matrix.

## Preflight access/safety matrix

| Area | Classification | Safety boundary |
| --- | --- | --- |
| Cloudflare deployment/env | RUNNABLE_WITH_ENV_VARS | Read-only Cloudflare token/account/project evidence required. |
| Public browser routes | RUNNABLE_NOW | `npm run test:e2e:production-safe` only visits routes and captures sanitized evidence. |
| Request Access | RUNNABLE_WITH_ENV_VARS | No production write unless explicitly allowed with test-only data and backend proof. |
| Auth email/password | REQUIRES_OWNER_CREDENTIALS | Requires dedicated test account; never record tokens/cookies. |
| OAuth | REQUIRES_OWNER_CREDENTIALS | Requires provider sandbox/test account and callback evidence. |
| Passkey/WebAuthn | REQUIRES_MANUAL_DEVICE_OR_PROVIDER | Requires real device authenticator/security key. |
| OmniDash persistence | REQUIRES_OWNER_CREDENTIALS | Repo guardrails are local; live persistence needs backend read-back. |
| Supabase RLS/multi-tenant | RUNNABLE_WITH_ENV_VARS | Requires two tenant users and least-privilege validation; service role only server-side if approved. |
| BYOM | RUNNABLE_WITH_ENV_VARS | Requires sandbox provider key and redaction evidence. |
| Billing/payment | RUNNABLE_WITH_ENV_VARS | Sandbox/test payment credentials only. |
| PWA/mobile | RUNNABLE_NOW | Web viewport/manifest smoke is runnable; native install/device remains manual. |
| Performance/load | BLOCKED_BY_ENVIRONMENT unless k6 exists | `npm run perf:k6:smoke` must execute; skipped k6 is not a pass. |
| Branch protection/release gates | REQUIRES_OWNER_CREDENTIALS | GitHub settings/ruleset evidence requires owner/admin access. |

## Runnable commands

```bash
APEX_PROD_URL=https://apexomnihub.icu npm run test:e2e:production-safe
npm run release:validation-matrix
npm run verify:ci-integrity
npm run perf:k6:smoke
npm run check:pwa
npm run test -- tests/omnidash/useOmniDashAction.spec.tsx tests/omnidash/fake-success-guardrails.spec.tsx
```

## Live validation specs (2026-09-05)

The production-safe suite is one harness with one entrypoint. Do not add a parallel one.

| File | Matrix item | Certifies |
| --- | --- | --- |
| `tests/e2e-playwright/production-safe.live.ts` | `BROWSER_PUBLIC_ROUTES`, `PWA_MOBILE_WEB` | Route render evidence |
| `tests/e2e-playwright/production-safe-negative-controls.live.ts` | — | Nothing. Controls only: logged-out gating and client-side service-role absence. They can falsify, never certify. |
| `tests/e2e-playwright/production-safe-auth.live.ts` | `AUTH_EMAIL_PASSWORD` | Login, session artifact, protected route, real session termination |
| `tests/e2e-playwright/production-safe-persistence.live.ts` | `OMNIDASH_LIVE_PERSISTENCE` | Backend-accepted write + network-sourced read-back after a hard reload |
| `tests/e2e-playwright/production-safe-rls.live.ts` | `SUPABASE_RLS_MULTI_TENANT` | Tenant B denied on Tenant A's row, via UI and API |

Shared primitives live in `tests/e2e-playwright/helpers/production-validation-evidence.ts`
(redaction, run-scoped evidence, credential gating) and
`tests/e2e-playwright/helpers/production-validation-probes.ts` (network recording,
client-surface scan, login/logout). Every live file uses the `*.live.ts` suffix so
default `*.spec.ts` discovery can never hit production by accident, and each throws at
module scope unless `APEX_RUN_PRODUCTION_SAFE=true`.

### Credentials

Owner credentials load from environment variables only, optionally via an untracked
`.env.production-validation` (gitignored) read by
`scripts/ci/run-production-safe-validation.mjs`:

```
APEX_PROD_URL=https://apexomnihub.icu
APEX_TEST_USER_EMAIL=...
APEX_TEST_USER_PASSWORD=...
APEX_TENANT_B_EMAIL=...
APEX_TENANT_B_PASSWORD=...
```

Values are never printed, logged, committed, or written to an evidence file. Evidence
records credential **variable names** only. When a required variable is missing the
relevant spec writes a `REQUIRES_MANUAL_VALIDATION` record naming the missing variables
and skips with an `APEX-2030` tracker — it never degrades into a pass.

### Promotion rule

Every evidence record carries `certifies`. A matrix item may be promoted to `VERIFIED`
**only** from a record with `certifies: true`. `UNCERTAIN` records carry a `resolvedBy`
field naming the exact additional signal required; they are not partial passes.

### Browser-egress fallback

`scripts/ci/collect-production-http-evidence.mjs` collects HTTP-layer evidence (route
status, security headers, and a conclusive scan of the shipped client bundle for a
Supabase service-role credential) for environments where the browser cannot reach
production but Node can. It writes `certifies: false` on every record by design: it can
falsify, never certify.

## Evidence policy

Generated evidence lives under `artifacts/production-validation/` and must be sanitized before sharing. Evidence must not contain bearer tokens, cookies, service-role keys, private emails, payment data, raw auth headers, provider API keys, or private user data.

## Cloudflare deployment/env

Owner evidence must include production deployment ID, deployed commit/bundle provenance, required public env variable presence, forbidden service-role/secret absence from the client bundle, source-map exposure decision, and DNS/domain binding to the expected Cloudflare Pages project.

## Production-safe browser routes

The Playwright production-safe suite captures desktop/mobile screenshots, final URL, title, visible product signal, console/page errors, failed requests, 4xx/5xx responses, and route classification for `/`, `/login`, `/request-access`, `/demo`, and `/omnidash`. Auth-gated `/omnidash` is acceptable only when it gates clearly; blank screens, raw errors, misleading success, or generic failure text are failures.

## Request Access proof

Preferred certification requires a clearly marked test-only submission and backend row proof or explicitly verified mailto fallback. UI success alone is not persistence proof. If backend credentials are unavailable, classify as `HONESTLY_GATED` or `REQUIRES_MANUAL_VALIDATION`.

## Auth, OAuth, and passkey

Certification requires dedicated test accounts/provider sandboxes and redacted evidence for valid login, invalid login error behavior, logged-out protected-route behavior, OAuth redirect/callback persistence, and WebAuthn registration/assertion on a real authenticator.

## OmniDash persistence

Repo-local guardrails require local-only launches to remain `LOCAL_LAUNCHED` and never backend-confirmed `LIVE` without persistence/read-back. Live certification requires authenticated action execution, reload, backend read-back, and sanitized metadata with no secrets.

## Supabase RLS / multi-tenant

Owner-run validation must prove tenant A cannot read or mutate tenant B rows, unauthenticated users cannot access protected rows, service-role keys are never exposed to browser tests, and claimed audit/log records are created.

## BYOM / provider key handling

Owner-run validation must prove invalid key failure, sandbox-key success, UI/network/console/storage redaction, and absence of provider keys from screenshots/traces/reports. Disabled BYOM is `HONESTLY_GATED`, not passed.

## Billing / payment

If billing is release scope, only sandbox/test credentials may be used. Evidence must cover checkout start, failed payment behavior, successful sandbox payment, cancellation/refund/entitlement transition, webhook receipt, and persisted subscription state.

## PWA / mobile

Web validation covers manifest/icons/service-worker/mobile viewport smoke. Native Android/iOS certification requires device or emulator screenshots, install/open evidence, signed build provenance, and offline behavior only if claimed.

## Performance/load

`npm run perf:k6:smoke` is the safe production profile: one virtual user for a short read-only homepage smoke with thresholds for error rate, p95, p99, and checks. If k6 is missing, performance is `BLOCKED`, not passed.

## GitHub branch protection / release gates

Owner evidence must show required checks/rulesets for protected branches, dependency automation cannot merge failed checks, and release workflows reference the release validation matrix or equivalent required gate.

## Playwright Backend Modes

`npm run test:e2e` is the **render-smoke suite**. It runs against a local preview build (`BASE_URL=http://localhost:4173`) and validates UI rendering only — app-shell render, route reachability, asset/PWA access, no fatal console errors. It does **not** certify Supabase connectivity, authentication flows, or any production backend behavior. In this mode `global-setup` skips the Supabase healthcheck and every backend-dependent spec self-skips with a `BLOCKED(APEX-1207)` tracker, so the gate is never blocked by E2E backend reachability.

`npm run test:e2e:backend` is the **backend-required E2E suite** (`APEX_E2E_BACKEND_REQUIRED=true`). It enforces the full Test Integrity Doctrine R4: `global-setup` requires real, reachable Supabase credentials (`E2E_SUPABASE_URL` / `SUPABASE_URL`, an anon/publishable key, and — for dynamic user provisioning — `E2E_SUPABASE_SERVICE_ROLE_KEY`) and provisions a live test user; the backend-dependent specs then run at full strictness (`skipWithoutSupabaseConfig()` is a no-op in this mode). It fails hard (`APEX-1200`…`APEX-1204`) if the backend is unreachable, credentials are placeholders, or provisioning fails. **This is correct behavior.**

**A passing render-smoke suite is not production backend proof.** Production backend certification requires a passing `npm run test:e2e:backend` run against the designated E2E/staging Supabase project with valid secrets injected from GitHub Secrets — never from the local environment.

> **Infra remediation (separate owner action):** CI `build-and-test` (`ci-runtime-gates.yml`) previously failed with `APEX-1203: Backend unreachable` because the configured `E2E_SUPABASE_*` secrets pointed at an unreachable project. The render-smoke split unblocks the render gate, but the backend suite cannot run until the owner re-points `E2E_SUPABASE_URL` / `E2E_SUPABASE_ANON_KEY` / `E2E_SUPABASE_SERVICE_ROLE_KEY` at a live E2E project. This is tracked as an infra task and is **not** a code defect — do not mark backend flows VERIFIED until that suite runs green with live evidence.

## Supabase Environment Inventory

The APEX-OmniHub repository contains **three distinct Supabase variable contexts**. This is intentional but requires care to avoid misconfiguration:

| Context | Variables | Used By |
|---------|-----------|---------|
| Browser / Runtime | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_ANON_KEY` | Vite build, frontend client |
| CI Backend E2E | `E2E_SUPABASE_URL`, `E2E_SUPABASE_ANON_KEY`, `E2E_SUPABASE_SERVICE_ROLE_KEY` | Playwright backend-required tests (`test:e2e:backend`) |
| Local / Server | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Server-side code, local dev |

These three contexts **may point to different Supabase projects** (e.g. local dev project, shared staging project, production project). The apparent existence of "multiple Supabase instances" in the repo is not a bug — it reflects environment-boundary separation.

**Production certification requirement:** Confirm that `E2E_SUPABASE_URL` in GitHub Secrets points to the canonical staging/E2E project (not the local dev project or production). Align `VITE_SUPABASE_URL` with the intended deployment target. Document the canonical project ref here once confirmed.

Do not print, log, or commit secret values. Use `scripts/ci/verify-supabase-env-alignment.mjs` to inventory project refs (hostnames only) without exposing keys.
