---
version: 1.0.0
last_audited: 2026-06-12
status: verified
---

# APEX Enterprise Control Plane Runtime

> **Current-state note (2026-09-29):** these `npm run` names in this document are not defined in any `package.json` in the repository and should be treated as planned or historical, not runnable: `release:lattice`. The runnable scripts are in the root `package.json`.

## Runtime convergence

- Canonical CI/runtime target: **Node 24**.
- Minimum supported Node version: **Node 22** (`package.json` enforces `>=22 <25`).
- Authoritative release path: `npm ci` followed by `npm run ...` commands.
- `bun.lock` is retained only to preserve optional local-development parity; Bun is not the CI or release authority.
- Lockfile policy: `package-lock.json` remains authoritative. Do not remove `bun.lock` unless an npm/Bun parity report proves it is safe.

## Execution envelope

All mutating browser, edge, and orchestrator submissions must carry the proprietary APEX execution envelope:

- `trace_id`
- `correlation_id`
- `idempotency_key`
- `intent_hash`
- `attempt`
- `stale_after`
- `actor_id`
- `device_id`
- `policy_version`
- `compensation_ref`
- `schema_version`

Mutating requests missing `idempotency_key`, `intent_hash`, or `stale_after` fail closed. Parsing is deterministic and side-effect free.

## Idempotency, staleness, and compensation

`apex_idempotency_ledger` is the replay-grade ledger for mutating operations. Duplicate deliveries return the stored outcome, stale events return `STALE_EVENT`, and compensation-capable steps declare an `apex.comp.*` reference in `apex_compensation_catalog`.

## Guardian policy-decision fabric

Guardian is the policy-decision point for privileged or sensitive actions. Every privileged action emits an `apex_policy_decisions` record with:

- principal
- action
- resource
- context
- decision
- determining_policy_id
- reason_code
- policy_version

The fabric is in-repo TypeScript, Python, and Postgres only. It does not use OPA, Cedar, hosted PDPs, or new policy-engine dependencies.

## BYOM Sovereign Intelligence

The APEX architecture implements a sovereign Bring Your Own Model (BYOM) layer:

- **Zero-Compute Paradigm:** Workspaces routing through BYOM incur zero compute spend for APEX. User requests hit the `byom-proxy` edge function and are streamed directly from the user's configured LLM provider.
- **Provider Keys as Identity:** The API key is the user's login credential, workspace identity, and model routing anchor.
- **Secure Vault:** Keys are encrypted at rest using AES-256-GCM via the `byom-cockpit` service. The proxy decrypts them seamlessly during inference.
- **Data Governance:** The proxy executes FlightControl filters (PII redaction and prompt injection defense) inline, guaranteeing data sovereignty and enterprise compliance.

## Trace continuity

Browser, edge, and orchestrator boundaries propagate W3C `traceparent` and `tracestate`. Structured logs include `trace_id`, `correlation_id`, `idempotency_key`, `intent_hash`, `policy_version`, `compensation_ref`, and explicit outcomes: `accepted`, `duplicate`, `stale`, `compensated`, `rejected`.

## Client persistence

- `localStorage`: tiny non-critical preferences only.
- IndexedDB: structured metadata, queues, and larger durable state.
- Cache API: cacheable request/response pairs and binary/media artifacts.
- Hot-path storage APIs are asynchronous.
- Migration is version-gated by `apex_storage_migration_v1`.

## Performance and accessibility budgets

Operator routes inherit these budgets:

- LCP <= 2.5s
- INP <= 200ms
- CLS <= 0.1

Critical operator screens must expose loading, empty, error, disabled, offline/degraded, and approval-pending states.

## Verification lattice

Run the npm release ladder with:

```bash
npm ci
npm run release:lattice -- --all
```

The lattice covers unit, integration, replay consistency, duplicate delivery, stale-event, policy diff, prompt-defense, deterministic eval, chaos/sim, DR, asset/runtime smoke, Playwright, Python, and security-audit gates.
