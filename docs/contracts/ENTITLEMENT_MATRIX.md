# Entitlement Matrix — APEX-REV-2026-09 WP-03

Verified against the code at `main` `92a5a03` plus WP-01 to WP-03, and against live production (`pg_policies`, `pg_get_functiondef` and subscription data read on 2026-09-28). The tier ladder follows RFC-003 and A1: `free < starter < pro < business ($299 CAD) < enterprise`. Base = `free`, per D1 option (a).

Status labels:
- `IMPLEMENTED+ENFORCED`: the feature exists and is gated.
- `IMPLEMENTED-UNGATED`: the feature exists but nothing gates it.
- `NOT-IMPLEMENTED`: no code delivers the promise.
- `NOT-LIVE`: the code exists but is not deployed or configured.
- `SERVICE`: the promise is a human service, not software.
- `SOFT-LAUNCH`: deliberately not marketed; the row states whether the code is deployed.

## Pricing promises

| Plan | Promise | Mechanism (surface owner) | Enforced where | Status |
|---|---|---|---|---|
| Base | OmniDash operations console | OmniDash RLS: the 5 policies become `authenticated` (WP-01). `useCapabilities.canViewOmniDash` now includes `free`/`starter` (WP-03). | Server (RLS) + UI | IMPLEMENTED+ENFORCED |
| Base | Core skill architecture (5 skills) | `check_skill_entitlement` / `enforce_skill_entitlement` (DB) + `omniskills.ts` | Server (DB trigger, advisory lock) | IMPLEMENTED+ENFORCED |
| Base | Standard automations & workflows | `execute-workflow`, `execute-automation` (user JWT) | Server (auth only; no tier gate needed) | IMPLEMENTED+ENFORCED |
| Base | Community support | — | — | SERVICE |
| Pro | Revenue Engine skills (unlimited) | Same DB skill gates; `PRO` and `BUS` are unlimited (WP-03, F-24) | Server (DB) | IMPLEMENTED+ENFORCED. "Revenue Engine" is only a name in the copy: no separate skill class exists (`Pricing.tsx`, `OnboardingWizard.tsx`). |
| Pro | Priority orchestration & routing | None. The only "priority" in the orchestrator is model-source order (`orchestrator/activities/plan_generation.py:84`). | — | **NOT-IMPLEMENTED**: WP-08 should remove this from the copy |
| Pro | Stripe-managed billing portal | `create-billing-portal` (user JWT and Stripe customer) | Server | IMPLEMENTED+ENFORCED |
| Business | PhysiOmni device telemetry | `usePlan.canAccessPhysiOmni` (`PhysiOmniModule.tsx:75`) | UI, plus a signed ingest endpoint (`physiomni-ingest`) that checks the device registry | **SOFT-LAUNCH**: code present, not deployed, 0 devices. Keep it off the pricing copy (owner decision; D4 (b) unchanged). |
| Business | Advanced analytics & audit exports | Audit export now gated by `usePlan` (tier ≥ business) in `AuditsModule.tsx` (WP-03) | UI. Export is a client-side transform of rows the user can already read under RLS. | IMPLEMENTED+ENFORCED (export); **NOT-IMPLEMENTED** for "advanced analytics" as a separate feature |
| Business | Dedicated onboarding support | — | — | SERVICE |

## Paid-state mechanisms inventory (§4.3 B1)

| Mechanism | Live? | WP-03 action |
|---|---|---|
| `usePlan` (`apps/omnihub-site/src/hooks/usePlan.ts`) | Yes | None needed. It already includes `business` on the RFC-003 ladder. |
| `usePaidAccess` → `useCapabilities` (mobile nav and mobile gate) | Yes | F-25: added `business` to the tier type and `tierLevels`, and to every `pro` capability list. |
| `omniskills.ts` skill cap | Yes | F-24: `BUS` is treated as unlimited, like `PRO`. |
| DB skill gates (`check_skill_entitlement`, `enforce_skill_entitlement`) | Yes | F-24: migration `20260928030000`, built from the live definitions. |
| `user_entitlements.tier` drift | Yes | L8: the WP-02 lifecycle sync now also sets `user_entitlements.tier` (`PRO`/`BUS`; `BASIC` when cancelled, expired or paused). |
| OmniDash RLS (`is_paid_user`) | Yes | Handled in WP-01 (5 policies). |
| `canAccessFeature` (`src/features/registry.ts:684`) | No callers | NOT-WIRED; left as is. |
| `postLoginRouter` / `useLoginRedirect` | No callers | NOT-WIRED; left as is. |
| `PaidAccessRoute` component | Dead | Not wired (owner instruction). |

## Known data exception
The E2E account holds a manually granted `pro` subscription with no `user_entitlements` row, so skill caps still treat it as `BASIC`. Real purchases create that row through `activate_client_subscription`, so this affects only grants made by hand.
