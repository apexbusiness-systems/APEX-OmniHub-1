---
version: 1.0.0
last_audited: 2026-09-28
status: proposed
---

# RFC: Orchestrator Hosting Decision (L1)

Decision memo only, with no code. It answers the five questions the owner set on 2026-09-28. **Owner decision required.** Nothing in this memo is approved: Oracle Cloud is a new vendor (N1), and Phases 1 to 4 of the earlier chat plan are withdrawn until the owner decides.

Labels: **[V]** verified in this repo or a live probe on 2026-09-28. **[S]** vendor documentation found by web search (cited). **[U]** unverified.

## 1. Why did Render suspend the service, and what does restoring cost?

- **[V]** The orchestrator host answers with `x-render-routing: suspend`, so the service is suspended (not crashed and not failing deploys).
- **[U] The reason is not determined.** Render's event history would show it (`service_suspended`, `suspender_added`), but the Render tool refuses to run until the owner confirms a workspace. The account has one workspace, "APEX's workspace" (team). **Owner: confirm it, and I will read the events.**
- **[S]** Render's documented suspension causes include free instances exhausting the 750 monthly hours, and free services exhausting outbound bandwidth when no payment method is on file ([Render pricing and free-tier docs](https://render.com/docs/free)). A billing lapse or a manual suspend is also possible and can't be ruled in or out yet.
- **[S]** Cost to restore: background workers have no free tier (Starter is the minimum), and an always-on Starter web service plus a small Postgres was about $13/month in July 2026 ([Render pricing](https://render.com/pricing)). The API and the worker are two services, so roughly two Starter instances. **[U]** Verify the exact price on the Render pricing page.
- **[S]** If the worker still uses Temporal Cloud, its Essentials plan has a **$100/month minimum** ([Temporal Cloud pricing](https://docs.temporal.io/cloud/pricing)). **[U]** Whether Temporal Cloud is in use is not visible from the repo (`orchestrator/main.py:116-117` supports both API-key and self-hosted configs).
- **[V]** The production build defaults the client to the Render URL: `deploy-production-cf-direct.yml:151` falls back to `https://apex-orchestrator-api.onrender.com`. Any host change also needs the `VITE_ORCHESTRATOR_URL` repo variable set and a rebuild.

## 2. Which workflows still need Temporal at HEAD? Can pg_cron remove the worker and Temporal?

The approved RFC (`RFC_2026_07_01_WORKFLOW_SCHEDULER_PGCRON.md`, status Approved) moved only **scheduled `workflows`** onto `pg_cron` and `pg_net`, and it lists Temporal intents as out of scope (§18).

| Orchestrator piece | Needs Temporal? | Evidence |
|---|---|---|
| `AgentWorkflow` (agent goals) | **Yes** | `workflows/agent_saga.py:71`. Started by `POST /api/v1/goals` (`server.py:87`, `:115`). Caller: `apex-agent/index.ts:150`. |
| `UniversalOrchestratorWorkflow` | **Yes** | `workflows/universal_saga.py:86`. Started at `server.py:198`. |
| `PhysiOmniAnomalySaga` | Registered only | `workflows/physiomni_saga.py:37`, registered at `main.py:183`. No start site found in `orchestrator/`. PhysiOmni is not live. |
| OmniBoard router (`start`, `connect`, session, connection rotate) | **No** | `orchestrator/omniboard/router.py`. It has no `start_workflow` calls, so it is plain API. |
| Scheduled workflows | **No** (already `pg_cron`) | The approved RFC above. |

**Answer:** `pg_cron` cannot remove Temporal entirely at HEAD, because agent goals and universal intents still start Temporal workflows. It could remove the worker only after those two are ported, which needs a new RFC and real code. A smaller step, hosting only the API (for OmniBoard), might work **[U]**: it depends on whether `server.py` connects to Temporal at startup, and that would need a code change if so.

## 3. What does L1 break for users today, and does it block revenue?

- **Phase 0 is a no-op [V].** `OMNIBOARD_SESSION_SECRET` is read by no code: `git grep SESSION_SECRET` over `.ts`, `.tsx`, `.py` and `.js` returns nothing, and `ENV_CLASSIFICATION.md:33` says "reserved, not yet wired". Setting it is harmless but changes nothing. It should not be reported as a fix for OmniBoard.
- **Broken today [V]:** agent goals (`apex-agent` to `/api/v1/goals`), OmniBoard app connection (`omnilink-port/index.ts:1422`, `:1448` call the orchestrator), and workflow triggers that go through `trigger-workflow`. `ORCHESTRATOR_URL` is set to the suspended host, so these calls fail upstream rather than returning the honest "unavailable" response that `omnilink-port` gives when the URL is unset (`:1422-1427`).
- **Not broken [V]:** `create-checkout`, `stripe-webhook`, `activate-client` and `create-billing-portal` contain no reference to the orchestrator (a case-insensitive `git grep` for "orchestrator" matches nothing in each), and scheduled workflows run on `pg_cron`.
- **Conclusion:** L1 does **not** block the revenue path (WP-04, WP-07, WP-08). This memo does not preempt them.

## 4. Options compared

| | (a) Restore Render | (b) `pg_cron` consolidation | (c) Oracle Cloud VM | (d) Owner machine + tunnel |
|---|---|---|---|---|
| Cost | About 2 Starter instances **[S/U]**, plus $100/month Temporal Cloud if in use **[S]** | $0 new | $0 on the free tier, but a card is required (see 5) | $0 marginal (power and hardware) |
| New vendors | 0 (existing) | 0 | **1 (Oracle)**, needs owner approval under N1 | 0 if the tunnel is Cloudflare (existing) |
| Ops burden | Low | Medium, to build (new RFC, port two workflows) | High: OS, Docker, Temporal, backups | High: uptime, power, network, patching |
| HA | Single instance per service at Starter | Supabase-managed | None (single VM) | None |
| Data risk | Low (state in Temporal Cloud and Supabase) | Low | Medium (single node, self-run backups) | Medium to high (home network and hardware) |
| Restores at HEAD | Everything | Only after porting agent goals and universal intents | Everything, if Temporal is hosted too | Everything, if Temporal is hosted too |

**Temporal note.** `temporal server start-dev` is documented by Temporal as a **development** server. Using it in production is not recommended: it is a single process, and its default storage is in-memory or a local file. The earlier chat plan proposed it with SQLite for production, and that proposal is **withdrawn**. A production self-hosted Temporal needs the Temporal server plus a real database, which raises the ops burden of (c) and (d) further.

## 5. Potential cost

- **(c) Oracle Cloud:** a payment card is required at signup even for the free tier, and moving to pay-as-you-go can incur charges. Label: **potential cost**. Free-tier shape and reclamation rules change (**[U]** verify at signup).
- **(a) Render:** recurring paid cost. **Temporal Cloud:** recurring paid cost if used.
- **(b) and (d):** no card, though (d) has hidden costs in the form of downtime risk.

## 6. Recommendation

1. Do not spend on hosting yet: revenue does not depend on it (answer 3).
2. **Confirm the Render workspace** so I can read the suspension reason. If it is a fixable billing or limit issue, (a) is the fastest and lowest-risk restore.
3. Decide first whether agent goals and OmniBoard connection are part of what the paid plans promise at launch (see `docs/contracts/ENTITLEMENT_MATRIX.md`). If not, the honest option is to show "unavailable" and defer hosting.
4. (b) is the long-term $0 path but needs its own RFC. (c) and (d) are not recommended for production because Temporal would run as a single node.

## 7. Verification plan

Read Render events for the suspension reason. Confirm whether Temporal Cloud is in use. Check whether `server.py` needs Temporal at startup. Verify current Render and Oracle prices on their pricing pages.
