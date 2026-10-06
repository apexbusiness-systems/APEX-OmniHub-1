---
version: 1.0.0
last_audited: 2026-06-12
status: verified
---

<!-- APEX_DOC_STAMP: VERSION=v1.6.0 | LAST_UPDATED=2026-05-31 -->
# APEX OmniHub — Edge Functions API Reference

**Base URL:** `https://rtopreovkywofgwgmozi.supabase.co/functions/v1/`
**Auth:** All endpoints require `Authorization: Bearer <token>` unless noted.

## Quick Reference

**Reconciled 2026-09-29 (Quick Reference table only; the endpoint sections below were not re-audited):** the repository holds **34** edge functions (`scripts/ci/edge-functions.manifest.json`); **29** of them are deployed (Supabase Management API, read-only). Not deployed: `mcp-proxy` (must not be deployed — see `docs/contracts/MCP_PROXY_SECURITY_REVIEW.md`), `notify-access-request`, `omnibridge-control`, `physiomni-action`, `physiomni-ingest`. `test-integration` and `omnilink-agent` are deployed but not in the repository (stale). The original list below was written for 31 functions on 2026-05-31; the "Auth Required" column is that original wording, and the rows added on 2026-09-29 state the mechanism in code.

> **Deprecation notice:** `apex-assistant` is deprecated and returns **410 Gone** — all clients must use `apex-agent`. `omnilink-agent` is abolished.

| Function | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `apex-assistant` | POST | — | **DEPRECATED — 410 Gone. Use `apex-agent`.** |
| `apex-voice` | POST | Yes (anon) | Real-time voice processing |
| `byom-cockpit` | POST | Yes (anon) | Bring-Your-Own-Model cockpit interface |
| `byom-proxy` | POST | Yes (anon) | Bring-Your-Own-Model proxy relay |
| `mcp-proxy` | POST | Yes (anon) | MCP protocol proxy. **Not deployed; do not deploy** (spawns subprocesses the Edge Runtime does not allow). |
| `apex-agent` | POST | Yes (anon or service) | Submit agent goal for orchestration |
| `omnilink-eval` | POST | Yes (service only) | Run evaluation suite |
| `omnilink-port` | POST | Yes (anon) | Universal connector input normalization |
| `omnilink-retry-scheduler` | POST | Yes (service) | Retry scheduler for failed omnilink tasks |
| `trigger-workflow` | POST | Yes (service) | Dispatch Temporal workflow |
| `execute-automation` | POST | Yes (service) | Direct workflow execution |
| `omni-runs` | POST | Yes (anon or service) | Run tracking and management |
| `test-integration` | POST | Yes (service) | Integration smoke testing. **Deployed but not in the repository (stale).** |
| `omnibridge-control` | POST | Yes (service) | OmniBridge command and control. **Not deployed.** |
| `generate-business-skills` | POST | Yes (anon) | AI-powered business skill generation |
| `activate-client` | POST | Yes (service) | Client onboarding activation |
| `platform-health` | GET | No | Platform health check |
| `ops-voice-health` | GET | No | Voice subsystem health check |
| `alchemy-webhook` | POST | No (HMAC-signed) | Alchemy blockchain event webhook |
| `verify-nft` | POST | Yes (anon) | NFT ownership verification |
| `web3-nonce` | GET | No | Generate SIWE nonce |
| `web3-verify` | POST | No | SIWE wallet authentication |
| `create-checkout` | POST | Yes (anon) | Stripe checkout session creation. **Fail-closed** — returns HTTP 503 `BILLING_NOT_CONFIGURED` if `STRIPE_SECRET_KEY` or `STRIPE_PRICE_ID_PRO` env vars are absent. Stripe client only instantiated when both secrets present. |
| `stripe-webhook` | POST | No (HMAC-signed) | Stripe payment event webhook |
| `send-push-notification` | POST | Yes (service) | Mobile push delivery |
| `storage-upload-url` | POST | Yes (anon) | Generate signed storage upload URL |
| `byom-login` | POST | No gateway JWT; the provider API key is the credential (probed against the provider) | BYOM login: derives an identity from the key fingerprint and stores the encrypted connection |
| `create-billing-portal` | POST | Yes (user JWT) | Stripe Customer Portal session |
| `execute-workflow` | POST | `X-Cron-Secret` or user JWT (gateway JWT off) | Workflow execution |
| `identity-webauthn` | POST | Yes (user JWT) | Device-bound passkey (WebAuthn) registration and assertion |
| `mcp-gateway` | POST | Scoped API key, Bearer (read and write keys; gateway JWT off) | MCP gateway with per-call audit and rate limits |
| `notify-access-request` | POST | `X-Cron-Secret` (called by a database trigger; **not deployed**) | Emails the owner when a lead is captured |
| `physiomni-action` | POST | **None in code** — gated by the `PHYSIOMNI_PHYSICAL_ACTIONS_ENABLED` flag (off = 403) and a kill switch; `approved_by` and `bypass_policy` come from the request body and are not verified (**not deployed**; see ops-log 9.56) | PhysiOmni physical-action endpoint |
| `physiomni-ingest` | POST | Signed device request; refuses all requests (503) when no signing key is configured (**not deployed**) | PhysiOmni device telemetry ingest |
| `seed-crypto` | POST | Yes (user JWT via `getUser`) | Seeds model-registry and provider-connection rows |
| `_shared` | — | — | Shared utilities directory (not a callable endpoint) |

---

## Core Endpoints

### POST /apex-agent

Submit a natural language goal for the Tri-Force orchestration pipeline.

**Request:**
```json
{
  "goal": "string — natural language instruction (required)",
  "context": "object — optional key-value context",
  "session_id": "string — optional conversation thread ID",
  "man_mode": "boolean — require Manual Approval Node approval for RED lane (default: true)"
}
```

**Response:**
```json
{
  "workflow_id": "string",
  "status": "queued | executing | complete | man_pending | failed",
  "result": "object | null",
  "man_task_id": "string | null — present when MAN approval required"
}
```

**Error codes:**

| Code | Meaning |
|------|---------|
| 400  | Invalid goal or missing required field |
| 401  | Missing or invalid auth token |
| 403  | Guardian blocked — goal violates policy |
| 429  | Embedding budget exceeded for tenant |
| 503  | Temporal worker unavailable |

---

### GET /platform-health

No auth required. Returns platform operational status.

**Response:**
```json
{
  "status": "ok | degraded | down",
  "timestamp": "ISO 8601",
  "version": "semver",
  "components": {
    "database": "ok | degraded | down",
    "orchestrator": "ok | degraded | down",
    "cache": "ok | degraded | down"
  }
}
```

---

## Authentication

All endpoints except `web3-verify` and `platform-health` require authentication.

**Anon key** (for user-facing calls, subject to RLS):
```bash
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     https://rtopreovkywofgwgmozi.supabase.co/functions/v1/apex-agent \
     -d '{"goal": "List my recent tasks"}'
```

**Service role key** (server-to-server only, bypasses RLS — never use client-side):
```bash
curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     https://rtopreovkywofgwgmozi.supabase.co/functions/v1/trigger-workflow \
     -d '{"workflow_type": "agent", "input": {}}'
```

---

## Rate Limits

| Tier | Requests/min | Embedding tokens/month |
|------|-------------|----------------------|
| Free | 10 | 50,000 |
| Starter | 60 | 500,000 |
| Pro | 300 | 5,000,000 |
| Enterprise | Custom | Custom |

---

*Full OpenAPI spec coming in v1.5.0. Track at: https://github.com/apexbusiness-systems/APEX-OmniHub/issues*
