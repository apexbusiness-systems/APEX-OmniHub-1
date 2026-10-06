---
version: 1.8.3
last_audited: 2026-09-29
status: verified
---

# Universal Synchronized Orchestrator

```
 █████╗ ██████╗ ███████╗██╗  ██╗  ██████╗ ███╗   ███╗███╗   ██╗██╗██╗  ██╗██╗   ██╗██████╗
██╔══██╗██╔══██╗██╔════╝╚██╗██╔╝ ██╔═══██╗████╗ ████║████╗  ██║██║██║  ██║██║   ██║██╔══██╗
███████║██████╔╝█████╗   ╚███╔╝  ██║   ██║██╔████╔██║██╔██╗ ██║██║███████║██║   ██║██████╔╝
██╔══██║██╔═══╝ ██╔══╝   ██╔██╗  ██║   ██║██║╚██╔╝██║██║╚██╗██║██║██╔══██║██║   ██║██╔══██╗
██║  ██║██║     ███████╗██╔╝ ██╗ ╚██████╔╝██║ ╚═╝ ██║██║ ╚████║██║██║  ██║╚██████╔╝██████╔╝
╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝  ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝
```

**INTELLIGENCE DESIGNED.**
**_Directable • Accountable • Dependable_**


## Multi-Droplet Agent Pipelines & Edge Pre-Warming (v1.8.3)

APEX-OmniHub v1.8.3 delivers next-generation cross-system orchestration and enterprise latency guarantees:
- **Multi-Droplet Agent Pipelines**: OmniSlate supports attaching 2 or more active ecosystem tools simultaneously (e.g. DueRadar + Google Antigravity). Renders an interactive visual pipeline connector (`⚡ Multi-Agent Pipeline Active`) and dispatches multi-stage chained synthesis plans across attached MCP agents.
- **Edge Function Pre-Warming Heartbeat**: `SentinelPanel` runs an automatic 5-minute periodic heartbeat ping to `platform-health` and Supabase Edge Functions, keeping V8 isolates and backend containers hot to eliminate cold starts for enterprise users.
- **Strict Code Quality & SonarCloud A-Grade**: Clean code inspection across all components, zero ESLint warnings, single React 18.3.1 singleton, accessible keyboard listeners, and readonly prop contracts.

## OmniBoard Chat-Native Connection Layer (v3.1)

OmniBoard now exposes connector operations through the existing APEX agent path instead of adding new chat infrastructure. The registered universal intents are `connector.list`, `connector.status`, `connector.connect`, `connector.test`, `connector.disconnect`, and `connector.create_custom`; they route through the existing Intent Registry and MCP `omnihub_execute_intent` dispatcher. The proprietary custom connector scaffold lives at `src/omniconnect/scaffold/`, validates every user-supplied URL through the shared SSRF guard, and always creates raw-events-only `beta` connectors until an explicit human promotion occurs.

**Verification (CP-16):** OmniBoard's chat-native integration pathways are structurally proven via the `cp-16` E2E test matrix across 4 diverse topologies: **Legacy Software**, **Web 3 App**, **AI App**, and **Web 2 App**. This matrix strictly enforces the **Honest Gateway Law**, ensuring the FSM gracefully fails closed and reports accurate unavailability when the backend orchestrator is unreachable, without leaking trace errors.

## Autonomous App Icon Resolution & OmniSlate Context Pipeline (v3.2)

APEX-OmniHub enforces strict **Canonical Surface Ownership** between first-party APEX applications (`apex_app_installs`) and third-party integrations (`integrations`):
- **First-Party APEX Ecosystem**: Connects apps exclusively via MCP (`ApexAppsMcpModule`). First-party applications (e.g. DueRadar, aSpiral, CheapStays, FLOWBills) render high-DPI vector brand marks natively.
- **Third-Party Integrations & App Gallery**: Connects third-party SaaS platforms (Google Antigravity, GitHub, Slack, Stripe, Supabase) via OmniBoard ConnectorKit.
- **Autonomous Dynamic Resolution**: `ProviderLogo` dynamically resolves brand assets without disk preloading. External endpoints are probed via an autonomous `onError` cascade, with an honest fallback monogram avatar.
- **OmniSlate Context Droplets**: Integrated app tiles drag and drop or click directly into OmniSlate, rendering 28×28 minimized context pills with brand-specific ambient glow and hover dismissal controls.
- **Verified Module Capabilities (`moduleActionCapabilities.ts`)**: Explicitly wires and certifies live backend capabilities for `Billing` (Stripe Customer Portal via `create-billing-portal`), `Files` (tenant-scoped Supabase Storage upload/delete), `Workflows` (orchestration dispatch via `execute-workflow`), and `Automations` (rule execution via `execute-automation`).

**Release line:** 1.8.3 (no release cut since 2026-08-23) | **package.json version:** 1.8.3 | **App package:** 1.3.10 | **Docs audit:** 2026-09-29 (`main` @ `6c62fdb8`)

[![CI Runtime Gates](https://github.com/aoid-org/APEX-OmniHub/actions/workflows/ci-runtime-gates.yml/badge.svg)](https://github.com/aoid-org/APEX-OmniHub/actions/workflows/ci-runtime-gates.yml)
[![Orchestrator CI](https://github.com/aoid-org/APEX-OmniHub/actions/workflows/orchestrator-ci.yml/badge.svg)](https://github.com/aoid-org/APEX-OmniHub/actions/workflows/orchestrator-ci.yml)
[![Security Regression Guard](https://github.com/aoid-org/APEX-OmniHub/actions/workflows/security-regression-guard.yml/badge.svg)](https://github.com/aoid-org/APEX-OmniHub/actions/workflows/security-regression-guard.yml)
[![License](https://img.shields.io/badge/license-proprietary-red)]()

---

## Current Status (2026-09-29)

Verified against `main` @ `6c62fdb8`. Full detail: [CURRENT_PLATFORM_STATE_2026_09_29.md](./memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_09_29.md) and [CANONICAL_STATE_2026-09-29.md](./.understand-anything/CANONICAL_STATE_2026-09-29.md).

- **Merged since v1.8.3:** the September revenue-contract work — plan-tier provisioning fixes, Stripe subscription lifecycle sync, an entitlement matrix, lead capture with new-lead alerts, removal of client-bundled MCP secrets, PhysiOmni ingest hardening (the `physiomni-ingress` endpoint is retired), a reviewer-gated production deploy workflow, MCP-gateway least privilege, and a server-side audit-log write path. Log: [`docs/APEX_AGENT_OPERATIONS.md`](./docs/APEX_AGENT_OPERATIONS.md) §9.41 onward; contract: [`REVENUE_EXECUTION_CONTRACT.md`](./docs/contracts/REVENUE_EXECUTION_CONTRACT.md).
- **Merged is not the same as live.** Web builds deploy automatically when `main` changes. Database migrations are applied by the owner, and production edge functions deploy only from CI on `main` through manually dispatched, reviewer-gated workflows. Some September migrations and function changes were merged but not yet applied or deployed at the last check.
- **Not generally available:** the Business plan's PhysiOmni device telemetry (code present, not deployed, 0 devices). Launch status per plan feature is in the [Entitlement Matrix](./docs/contracts/ENTITLEMENT_MATRIX.md).
- **Orchestrator:** the Python/Temporal code is in this repository; the hosted service is currently suspended and the revenue path does not depend on it ([hosting memo](./memory/omni-recall/rfc/RFC_2026_09_28_ORCHESTRATOR_HOSTING.md), decision open).
- **Release evidence:** [`docs/release/release-validation-matrix.json`](./docs/release/release-validation-matrix.json) — 19 of 20 items `VERIFIED`, 1 `HONESTLY_GATED`. CI validates; **releases are cut manually by the owner**, and CI does not decide or certify them.

---

## 🚦 Start Here (Canonical Map)

**Before touching code, read the canonical architecture map:**

- [CURRENT_PLATFORM_STATE_2026_09_29.md](./memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_09_29.md) — current head, git-verified counts, production state, open owner items
- [CANONICAL_STATE_2026-09-29.md](./.understand-anything/CANONICAL_STATE_2026-09-29.md) — merged work packages and the finding-closure table
- [APEX_AGENT_OPERATIONS.md](./docs/APEX_AGENT_OPERATIONS.md) — operations manual and change log (canonical source of truth for deploys and incidents)
- [DOCUMENTATION_RELEASE_INDEX.md](./memory/omni-recall/docs/DOCUMENTATION_RELEASE_INDEX.md) — current maps, READMEs, status, audits, and runbooks
- [ARCHITECTURE_CANONICAL_MAP.md](./memory/omni-recall/docs/architecture/ARCHITECTURE_CANONICAL_MAP.md)
- **[Production Certification Status](./docs/release/release-validation-matrix.json)** (Current Release Evidence Boundary)
- **[Release Gate Audit 2026-07-01](./docs/audits/release-gate-audit-2026-07-01.md)** — historical full-build gate audit at `845fced` (28 gates + 31/31 CI checks on PR #1550); not a statement about the current head
- [CI Status Policy](./memory/omni-recall/docs/project-status/CI_STATUS_POLICY.md)
- **[OmniDash Canonical Layout Law + P2+ Enhancements (PR #1516)](./memory/omni-recall/omnidash-p2plus-enhancements-2026-06-29.md)** — locked OmniDash layout, mobile/tablet one-handed UX (flick-to-set, header de-clip), and OmniMedia images + Files pipeline + server-side upload caps. Enforced by `npm run check:omnidash`.

---

## Overview

APEX OmniHub is the first **Universal Sync Orchestrator** for **governed execution** across ALL modern stacks, AI apps, legacy enterprise systems, and Web3 infrastructure. Think "Anti-OS", it is a "USO": one place to connect fragmented systems, translate universally, enforce policy, and produce an audit trail you can defend.

The platform relies on a "Holy Trinity" architecture:

1.  **OmniHub**: The Universal Sync Orchestrator (Logic & Policy).
2.  **OmniLink**: The Secure Gateway (Connectivity).
3.  **OmniPort**: The Multimodal Normalizer (Input/Output).

> OmniHub's job is simple: **translate intent into deterministic execution**, without lock-in, without chaos, and without silent failure.

---

## Platform Statistics (Repository Snapshot 2026-09-29, git-verified)

| Metric                                           | Value                                             |
| ------------------------------------------------ | ------------------------------------------------- |
| **Source Files (`src/`)**                        | 322 TypeScript/TSX files (234 `.ts` + 88 `.tsx`)  |
| **React Components (`src/`)**                    | 88 `.tsx` component files                         |
| **Edge Functions (`supabase/functions/`)**       | 35 directories (34 function dirs + `_shared`)     |
| **Database Migrations (`supabase/migrations/`)** | 126 `.sql` files (116 forward + 10 rollback)      |
| **CI/CD Workflows (`.github/workflows/`)**       | 23 workflow files                                 |
| **Test/spec sources (whole repo)**               | 491 files (`*.test.*`, `*.spec.*`, `test_*.py`)   |
| **Vitest (root suite)**                          | 3216 passed, 70 skipped, 25 todo (303 files)      |
| **Custom Hooks (`src/`)**                        | 23 hook files matching `use*.ts*` in `src/`       |
| **Orchestrator (Python)**                        | 149 tracked files (excludes `__pycache__`)        |

Counts are reproducible with the commands in [CURRENT_PLATFORM_STATE_2026_09_29.md](./memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_09_29.md) §8; the test/spec count uses a different scan than earlier snapshots and is not comparable to them. Older baselines (including the July 2026 history and PR-by-PR notes that used to live here) are preserved in the dated files under [`memory/omni-recall/docs/`](./memory/omni-recall/docs/) and [`.understand-anything/`](./.understand-anything/).


---

## What OmniHub Is (and Is Not)

✅ **Is:** A secure orchestration layer + universal translation engine that standardizes execution, policy enforcement, and auditability across your entire stack.

---

## Core Pillars

### 1) Tri-Force Protocol (Governed Autonomy)

A 3-tier agent architecture designed to keep unsafe reasoning from reaching production:

| Layer        | Role                             | Implementation             |
| ------------ | -------------------------------- | -------------------------- |
| **Guardian** | Policy & safety evaluation       | `orchestrator/security/`   |
| **Planner**  | Deterministic planning           | `orchestrator/workflows/`  |
| **Executor** | Tool execution with audit trails | `orchestrator/activities/` |

### 2) Orchestrator (Durable Workflows)

**Temporal.io**-backed orchestration for workflows that survive restarts:

- Event sourcing + deterministic replay
- Saga-style compensation patterns
- Idempotent task execution
- Manual Approval Node gates (**MAN Mode** - `supabase/migrations/20260108120000_man_mode.sql`)

> **Status (2026-09-29):** the orchestrator code is maintained here, but the hosted orchestrator service is suspended and is not part of the revenue path. See the [hosting memo](./memory/omni-recall/rfc/RFC_2026_09_28_ORCHESTRATOR_HOSTING.md).

### 3) Fortress Protocol (Security & Compliance)

Security is not "a feature." OmniHub enforces:

- **Armageddon Test Suite**: Continuous chaos engineering and red-teaming engine.
- **Zero-trust device registry** (`20251218000001_create_device_registry_table.sql`)
- **Audit logging** (`20251218000000_create_audit_logs_table.sql`)
- **Emergency controls** (`20260103000000_create_emergency_controls.sql`)
- **OMEGA security hardening** (`20260125000001_enable_omega_security.sql`)

### 4) OmniLink & OmniPort (Connectivity & Normalization)

The "Trinity" connectivity layer:

- **OmniLink**: The Secure Gateway for universal connectivity (`20260111000000_omnilink_universal_port.sql`).
- **OmniPort**: The Multimodal Normalizer for standardized I/O and DLQ (`20260124000000_omniport_dlq.sql`).
- **OmniTrace**: Full replay & tracing capability (`20260125000000_omnitrace_replay.sql`).

### 5) Edge Compute Layer (Media & CORS)

Client-side infrastructure for deterministic media delivery:

- **Edge CORS Proxy**: **[LEGACY]** Vercel Edge Function (`api/cors.ts`) — historical only, superseded by Cloudflare Pages Worker (`edge/cors-proxy/edge-cors-proxy.js`). Retained for reference; Cloudflare-first topology is canonical.
- **LRU Media Cache**: 250 MB ceiling with localStorage ledger eviction (`lib/media/EdgeCacheController.ts`).
- **Cloudflare Worker**: Stateless CORS proxy at `edge/cors-proxy/edge-cors-proxy.js` for production CDN.
- **Fail-Safe Design**: Every cache miss gracefully degrades to proxy URL — zero silent failures.

### 6) Web3-Native Identity (Optional)

- SIWE (Sign-In with Ethereum) - `supabase/functions/web3-verify/`
- NFT verification - `supabase/functions/verify-nft/`
- Multi-chain support (`20260101000000_create_web3_verification.sql`)
- Chain transaction logging (`20260109120000_create_chain_tx_log.sql`)

---

## Edge Functions (35 Directories in Repository: 34 function dirs + `_shared`)

The 34 functions below are the repository's canonical set (`scripts/ci/edge-functions.manifest.json`, enforced by `npm run check:edge-fn-manifest`). What is **deployed** differs from what is in the repository — check the current listing in [CURRENT_PLATFORM_STATE_2026_09_29.md](./memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_09_29.md) §4 before assuming a function is live. Authentication is per function (user JWT, signed webhook, API key or shared secret); the audited mechanisms for the functions that skip gateway JWT verification are in the [operations log §9.44](./docs/APEX_AGENT_OPERATIONS.md). Production edge functions deploy only from CI on `main` (see [operations manual §5](./docs/APEX_AGENT_OPERATIONS.md)).

| Function                 | Purpose                    |
| ------------------------ | -------------------------- |
| `activate-client` | Plan activation for the signed-in user (calls the activation RPC) |
| `alchemy-webhook` | Alchemy chain-event webhook receiver (signature-verified) |
| `apex-agent` | APEX Agent — primary AI orchestration endpoint (also handles `oauth_exchange`) |
| `apex-assistant` | Deprecated; returns 410 and points callers to `apex-agent` |
| `apex-voice` | Real-time voice (WebSocket) |
| `byom-cockpit` | BYOM cockpit API |
| `byom-login` | BYOM login: provider connections and model registration |
| `byom-proxy` | BYOM secure streaming relay |
| `create-billing-portal` | Stripe Customer Portal session |
| `create-checkout` | Stripe Checkout session for paid plans |
| `execute-automation` | Automation rule execution |
| `execute-workflow` | Workflow execution (cron secret or user JWT) |
| `generate-business-skills` | SkillForge business-skill generation |
| `identity-webauthn` | Device-bound passkey (WebAuthn) registration and assertion |
| `mcp-gateway` | MCP gateway with scoped read/write keys, per-call audit and rate limits |
| `mcp-proxy` | Stdio-transport MCP bridge — **not deployable** in the Edge Runtime (see [security review](./docs/contracts/MCP_PROXY_SECURITY_REVIEW.md)) |
| `notify-access-request` | Emails the owner when a lead is captured |
| `omni-runs` | OmniTrace workflow-runs API |
| `omnibridge-control` | OmniHub → SBBL-HQ override and hotfix control plane |
| `omnilink-eval` | Evaluation-case scoring |
| `omnilink-port` | Universal connector (API-key and user routes) |
| `omnilink-retry-scheduler` | Scheduled retry runner for OmniLink work |
| `ops-voice-health` | Ops voice health check |
| `physiomni-action` | PhysiOmni action endpoint (not deployed) |
| `physiomni-ingest` | PhysiOmni signed device ingest — fail-closed; not deployed |
| `platform-health` | Platform health probe (also the edge pre-warm target) |
| `seed-crypto` | Seeds model-registry and provider-connection rows |
| `send-push-notification` | Mobile push delivery |
| `storage-upload-url` | Signed upload URLs for tenant Files |
| `stripe-webhook` | Stripe webhook receiver and subscription lifecycle sync |
| `trigger-workflow` | Temporal dispatch (the idempotent workflow gateway) |
| `verify-nft` | NFT ownership check |
| `web3-nonce` | Wallet-signature nonce issuance |
| `web3-verify` | SIWE authentication |

---


### Runtime and release authority

APEX OmniHub requires **Node.js 22+** (Node 22 LTS recommended; Node 24 also supported; supported range `>=22 <25`). **npm** is the authoritative package manager for CI, releases, and the canonical lockfile (`package-lock.json`). Use `npm ci` for clean installs in CI. bun is optional for local development — `bun install` or `bun run` may be used for speed, but `bun.lock` is not relied on by CI. Both `bun.lock` (local bun users) and `package-lock.json` (CI canonical; required by `npm audit`) are committed. Python 3.11+ is required for orchestrator services. See CLAUDE.md §2 for the full policy.

## Repository Layout

```
/src                 - Core frontend/domain source tree (322 files: 234 .ts + 88 .tsx)
/dashboard/OmniDashShell.tsx  -  Unified dashboard Shell / layout
/apps/omnihub-site/dashboard/components/  -  Panels/widgets: (Today, Pipeline, KPIs, Ops, etc.)
/src/omnidash/uiRegistry.ts  -   UI registry wiring

/supabase/migrations - Database schema (126 .sql files: 116 forward + 10 rollback)
/supabase/functions  - Edge functions (34 function directories + _shared = 35 total)
/orchestrator        - Temporal workers and orchestration services (149 tracked files)
/tests               - Automated test suite
/.github/workflows   - CI/CD workflows (23 workflow files)
```

---

## Canonical UI Boundaries & Widget Truth

To maintain strict architecture safety and prevent "widget drift" across the platform, the following product laws apply globally to OmniDash and must **never** be violated:

✅ **OmniBoard**: The **ONE AND ONLY** user-facing UI endpoint for third-party application integration and onboarding. It connects 3rd-party apps and AI models deterministically via the `apex-universal-sync-orchestrator`.
❌ **Links**: An independent widget **strictly** for collecting URLs to pass as context. It must **never** route to OmniBoard, and must **never** perform app integrations.
✅ **Module Boundaries**: All OmniDash sidebar modules must load as distinct modal overlays using the `useOmniModal` state store. No widget may silently mount another widget's FSM (e.g. Links cannot mount OmniBoardWizard).
✅ **Action Gating**: Action execution across modules is governed by a **module-keyed capability map** (`moduleActionCapabilities.ts`), keyed by `moduleKey + actionId` and covering both baseline and live action ids. Unsupported actions fail-closed at the UI shell with **module-specific copy** and never call `trigger-workflow` (PR #1441). Labels that arrive as raw ids or contain underscores are humanized (`create_workflow` → `Create Workflow`) without implying the action is wired.

---

## Quick Start (Local)

### Prerequisites

- Node.js **22+** (Node 22 LTS recommended; Node 24 also supported; range `>=22 <25`)
- Python **3.11+**
- Docker & Docker Compose

### Full Stack — One Command (Recommended)

```bash
cp .env.example .env.local  # Fill in your Supabase credentials
docker compose -f docker-compose.dev.yml up
```

This starts: Frontend (port 8080) + Temporal worker + Temporal UI (port 8233) + Redis.
Supabase runs in the cloud — point `.env.local` to your Supabase project. Browser builds require `VITE_SUPABASE_URL` plus `VITE_SUPABASE_PUBLISHABLE_KEY` or legacy `VITE_SUPABASE_ANON_KEY`; CI/production builds fail closed when they are missing. For local UI-only work without Supabase, set `APEX_ALLOW_MISSING_SUPABASE_CONFIG=true`.

### Manual Setup (alternative)

#### 1) Install dependencies

```bash
npm ci
# or, for local dev speed: bun install
```

#### 2) Run OmniDash (main UI)

```bash
npm run dev
# or, for local dev speed: bun run dev
```

#### 3) Run the Orchestrator (Temporal)

```bash
cd orchestrator
pip install -r requirements.txt
python -m main
```

### Docker (orchestrator production overlay)

```bash
cd orchestrator
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Deployment Targets

| Slot | URL | Notes |
|---|---|---|
| Production | https://apexomnihub.icu | Cloudflare Pages — canonical production; the Pages project builds from `main` with automatic production deployments enabled (project settings read 2026-09-29) |
| Shadow | https://apex-omnihub-shadow.pages.dev | Shadow slot provisioned 2026-05-20; production deployments and branch previews are off (2026-09-29) |

---

## CI / Quality Gates

Run these before any PR:

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript strict mode
npm run test       # Vitest suite
npm run build      # Production build
```

### CI/CD Pipelines (Selected Workflows)

| Workflow                        | Trigger         | Purpose                      |
| ------------------------------- | --------------- | ---------------------------- |
| `ci-runtime-gates`              | PR / push to main | Build, test, lint, typecheck |
| `apex-governance`               | PR / push to main | APEX policy, secret scan, dependency audit, RFC marker, OmniSkin guard (aggregate `governance-gate`) |
| `rsi-governance`                | PR              | RSI governance gate for governed workflow and policy files |
| `ops-doc-guard`                 | PR              | Requires an operations-doc update alongside critical files |
| `security-regression-guard`     | PR / push to main | Security + dependency guards |
| `secret-scanning`               | Push / PR / scheduled | Secret scanning        |
| `orchestrator-ci`               | Push / PR       | Orchestrator Python test suite |
| `integration`                   | Push to main/work/develop | Integration E2E harness |
| `chaos-simulation-ci`           | Push / PR / scheduled | Resilience testing     |
| `cd-staging`                    | Push to main / manual | Staging deployment  |
| `release`                       | Push to main / manual | Release validation (a release is cut only by the owner's version commit) |
| `deploy-production-cf-direct`   | Manual          | Governed Cloudflare Pages production deploy |
| `deploy-web3-functions`         | Manual, reviewer-gated | Edge function deployment (functions only, never migrations) |
| `deploy-mcp-gateway`            | Manual, reviewer-gated | Deploys only the `mcp-gateway` function |
| `alert-guard-rail-violation`    | After a CI run  | Guardrail violation alerting |

The two Supabase deploy workflows run in the `production-db` GitHub environment (required reviewer) and only from `main`; a test (`tests/infrastructure/deploy-workflow-gates.test.ts`) fails the build if any workflow that uses the Supabase deploy secrets gains an automatic trigger.

---

## Documentation

Full documentation is available in the [`docs/`](./memory/omni-recall/docs/) directory.

| Document                                                                                | Description           |
| --------------------------------------------------------------------------------------- | --------------------- |
| [Current Platform State](./memory/omni-recall/docs/CURRENT_PLATFORM_STATE_2026_09_29.md)             | Current head, verified counts, production state and open owner items |
| [Release Notes v1.6.0](./memory/omni-recall/archive/docs/releases/RELEASE_NOTES_v1.6.0.md)                 | Historical v1.6.0 release notes |
| [Executive Architecture Summary](./memory/omni-recall/docs/architecture/EXECUTIVE_ARCHITECTURE_SUMMARY.md) | System design         |
| [Production Certification Status](./docs/release/release-validation-matrix.json) | Current certification authority |
| [Production Validation Harness](./docs/release/production-validation-harness.md) | How the live production-safe validation runs |
| [Revenue Execution Contract](./docs/contracts/REVENUE_EXECUTION_CONTRACT.md) | APEX-REV-2026-09 scope, findings and work packages |
| [Entitlement Matrix](./docs/contracts/ENTITLEMENT_MATRIX.md) | What each plan promises, and whether it is implemented and enforced |
| [Operations Manual and Change Log](./docs/APEX_AGENT_OPERATIONS.md) | Canonical deploy procedures, incidents, per-change log |
| [Documentation Release Index](./memory/omni-recall/docs/DOCUMENTATION_RELEASE_INDEX.md)                  | Current docs map, READMEs, status, audits, runbooks |
| [Testing Evidence & Armageddon Reports](./memory/omni-recall/docs/testing/README.md)                    | Validation history    |
| [PR Triage Report](./memory/omni-recall/docs/ops/PR_TRIAGE.md)                                      | Open PR resolution matrix |
| [OPS Runbooks](./memory/omni-recall/docs/ops/OPS_RUNBOOKS_CI_GUARDRAILS.md)                               | Operations procedures |
| [Supabase Setup](./memory/omni-recall/docs/infrastructure/SUPABASE_SETUP.md)                               | Database config guide |
| [orchestrator/README](./orchestrator/README.md)                                         | Temporal setup        |
| [orchestrator/MAN_MODE](./orchestrator/MAN_MODE.md)                                     | Manual Approval Node     |
| [orchestrator/ARCHITECTURE](./orchestrator/ARCHITECTURE.md)                             | Backend design        |

---

## Canonical E2E Testing Truth (APEX Build Doctrine)

To prevent test rot, rogue agent edits, and signal inversion (e.g., masking product bugs to achieve green CI), the following rules apply to all E2E testing:

1. **Test Integrity over Green CI**: `test.fail()` is banned. A test suite must be green *and* provably able to go red against a real backend. Never skip a failing test just to pass a CI gate.
2. **Strict Skip/Fixme Vocabulary**: `test.skip()` and `test.fixme()` are only permitted if they carry a formal tracking ID (e.g., `BLOCKED(APEX-1xxx): <reason>`). Generic skips or "PARTIAL PASS" verdicts are banned.
3. **Identity-Tested Modals**: Modals cannot be asserted using generic locators (e.g., `[role="dialog"]`). They must use `assertModalIdentityAndIsolation` to prove rendering fidelity, isolation (no overlapping z-index issues), and portal-mount stability.
4. **No Real DB Mocks**: The E2E suite requires a live backend (e.g. `apex-omnihub-e2e`). Auth tests rely on genuine session acquisition (`signInWithSupabaseSession`), not UI bypasses.
5. **Idempotent Seed Harness**: CI setup uses an Admin client to dynamically seed tests (creating test users, files, and `workflows`), ensuring clean run-state separation and proper RLS/append-only audit verification. 
6. **Responsive Modal Traps**: Universal Modals (like BYOM) use `<sm` responsive overrides (e.g., `w-[calc(100%-2rem)] max-w-md mx-auto`) to avoid off-canvas rendering on mobile viewports like iPads.
7. **PWA Hydration Stability**: PWA install logic relies on `window.__deferredPWAEvent` capture in `index.html` to prevent `beforeinstallprompt` race conditions during React hydration.

---

## Contributing (APEX Standard)

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Write tests for your changes
4. Run full gates: `npm run test && npm run lint && npm run typecheck && npm run build`
5. Submit a PR

### Non-Negotiables

- **No vendor lock-in** - portable adapters, clean interfaces
- **Single-port integration** - no scattered API calls
- **Idempotent operations** - safe to re-run, easy rollback
- **No secrets in code** - env/config only
- **Observable behavior** - health checks, structured logs

---

## 📄 Documentation

**Proprietary** - © 2026 APEX Business Systems Ltd.

---

```
 █████╗ ██████╗ ███████╗██╗  ██╗
██╔══██╗██╔══██╗██╔════╝╚██╗██╔╝
███████║██████╔╝█████╗   ╚███╔╝
██╔══██║██╔═══╝ ██╔══╝   ██╔██╗
██║  ██║██║     ███████╗██╔╝ ██╗
╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝
Intelligence Designed. Engineering the Impossible.
```

---

# APEX Bible Governance

# APEX Bible Complete Package

Version: **1.1.0**
Canonical governance package for APEX-level builds.

> **Single nav:** see [`governance/INDEX.md`](governance/INDEX.md).
> **Doctrine:** see [`governance/doctrine/APEX_BUILD_DOCTRINE.md`](governance/doctrine/APEX_BUILD_DOCTRINE.md).

---

## What This Locks In

- canonical build doctrine (13 principles)
- architecture review gates + merge-rights policy
- RFC template + usage policy
- CI policy gates (with a working policy-check script, not placeholders)
- secret scanning (gitleaks), dependency vuln scan (osv-scanner), SAST (CodeQL)
- service tiers (T1–T4) with SLOs and error budgets
- data classification (P0–P4) + privacy SLAs
- FinOps tags + budget tiers + AI cost caps
- release management + API versioning + deprecation lifecycle
- supply-chain controls (SBOM, signing, vendor review)
- DR (RPO/RTO) + on-call SLAs + postmortem + runbook templates
- threat model template (STRIDE + AI-specific)
- incident disclosure SLAs (PIPEDA/GDPR-aware)
- AI governance: prompt, kill switch, evaluation policy
- engineering onboarding with two scored merge-rights exercises
- 100-point build rubric + per-category scoring guide

## Drop-In Install

Copy this package into the root of your repository:

```text
/.github
/governance
/CHANGELOG.md
/CONTRIBUTING.md
/LICENSE
/Makefile
/README.md
/SECURITY.md
/package_manifest.json
```

## Implementation Order (Day 1)

1. Commit [`governance/doctrine/APEX_BUILD_DOCTRINE.md`](governance/doctrine/APEX_BUILD_DOCTRINE.md).
2. Enable [`.github/workflows/apex-governance.yml`](.github/workflows/apex-governance.yml). Mark the `governance-gate` job as a **required status check** in branch protection.
3. Require PRs to use [`.github/pull_request_template.md`](.github/pull_request_template.md).
4. Add reviewers in [`.github/CODEOWNERS`](.github/CODEOWNERS) (adjust team handles to match your org).
5. Require architecture review before granting merge rights (see [`governance/architecture/MERGE_RIGHTS_POLICY.md`](governance/architecture/MERGE_RIGHTS_POLICY.md)).
6. Install [`governance/ai/AI_AGENT_SYSTEM_PROMPT.md`](governance/ai/AI_AGENT_SYSTEM_PROMPT.md) into all internal AI agents.
7. Run `make apex-policy` locally to confirm green.

## Implementation Order (Week 1)

8. Classify every data store per [`governance/data/DATA_CLASSIFICATION.md`](governance/data/DATA_CLASSIFICATION.md).
9. Tag every cloud resource per [`governance/finops/COST_BUDGET_POLICY.md`](governance/finops/COST_BUDGET_POLICY.md).
10. Assign each service a tier per [`governance/release/RELEASE_POLICY.md`](governance/release/RELEASE_POLICY.md).
11. Declare SLOs per [`governance/observability/SLO_POLICY.md`](governance/observability/SLO_POLICY.md).
12. Write runbooks for the top-5 alerts per T1/T2 service using [`governance/ops/RUNBOOK_TEMPLATE.md`](governance/ops/RUNBOOK_TEMPLATE.md).
13. Verify kill switches per [`governance/ai/AI_KILL_SWITCH.md`](governance/ai/AI_KILL_SWITCH.md) for every production AI feature.

## Mandatory Rule

No feature, AI-generated change, refactor, or infrastructure update may merge unless it preserves:

- user workflow clarity
- modularity
- idempotency
- observability
- rollback capability
- domain boundaries
- regression resistance
- overload resistance
- data classification compliance
- cost attribution
- AI kill-switch availability

## Local Commands

```sh
make apex-policy        # run policy check (human-readable)
make apex-policy-json   # run policy check (JSON report)
make apex-validate      # validate package structure + manifest
make apex-verify        # full local validation (policy + structure)
make apex-install       # print install instructions for a target repo
make apex-zip           # build distributable zip
```

## Versioning

This package follows SemVer. See [`CHANGELOG.md`](CHANGELOG.md).
Contribute via [`CONTRIBUTING.md`](CONTRIBUTING.md).
Report security issues per [`SECURITY.md`](SECURITY.md).
