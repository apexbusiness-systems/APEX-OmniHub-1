---
title: Production Path Registry
created: 2026-06-28
status: active
workflow: omnidev-apex-pro-v2
source_of_truth: memory/omni-recall/docs/architecture/CANONICAL_TRUTH.md
rule: Production entry is root index.html -> src/main.tsx (root `vite build`), which imports styles and the dashboard from apps/omnihub-site/ through the `@` and `dashboard` aliases in vite.config.ts. Do not assume apps/omnihub-site/src/main.tsx is the entry (root CLAUDE.md OSE warning). Verify a path with the file tool before editing.
---

# Production Path Registry

Canonical live paths for APEX-OmniHub remediation. `[EXISTS]` verified 2026-06-28;
`[NET-NEW]` to be created by the cited phase. Editing ghost paths (`src/components/dashboard/`
for OmniDash work) is an automatic NO-GO — re-resolve to `apps/omnihub-site/dashboard/`.

## Shells & hosts

| Layer | Path | Status |
|---|---|---|
| OmniDash shell | `apps/omnihub-site/dashboard/OmniDashShell.tsx` | [EXISTS] |
| Modal host (sole chrome owner) | `apps/omnihub-site/dashboard/components/OmniSpatialHost.tsx` | [EXISTS] |
| Module renderer (moduleKey→component) | `apps/omnihub-site/dashboard/components/ModuleRenderer.tsx` | [EXISTS] |
| Module key registry | `apps/omnihub-site/dashboard/components/moduleComponents.ts` | [EXISTS] |
| Top bar / language switcher | `apps/omnihub-site/src/components/Layout.tsx` | [EXISTS] |

## Surface ownership & contracts

| Layer | Path | Status |
|---|---|---|
| Integration ownership (legacy → deprecated shim) | `apps/omnihub-site/dashboard/contracts/appIntegrationOwnership.ts` | [EXISTS] re-exports canon (P1 ✓) |
| Surface ownership canon (two-owner) | `apps/omnihub-site/dashboard/contracts/omniSurfaceOwnership.ts` (+ `.test.ts`) | [EXISTS] P1 ✓ |
| APEX Apps contract | `apps/omnihub-site/dashboard/contracts/apexApps.ts` | [EXISTS] inspect P3 |
| Module action capabilities | `apps/omnihub-site/dashboard/contracts/moduleActionCapabilities.ts` | [DONE] 2026-08-22 — verified onAction capabilities certified for Billing, Files, Workflows, Automations |
| Autonomous Provider Logo & Brand Engine | `apps/omnihub-site/dashboard/components/ProviderLogo.tsx` | [EXISTS] 2026-08-18 ✓ |
| Multi-Droplet Agent Pipelines | `apps/omnihub-site/dashboard/OmniDashShell.tsx` | [DONE] 2026-08-23 — Multi-app chained MCP context pipelines & visual indicator |
| Sentinel Edge Function Pre-Warming | `apps/omnihub-site/dashboard/components/SentinelPanel.tsx` | [DONE] 2026-08-23 — 5-minute periodic background heartbeat loop & warm indicator |

## Modules

| Layer | Path | Status |
|---|---|---|
| OmniBoard wizard (3rd-party only) | `apps/omnihub-site/dashboard/components/OmniBoardWizard.tsx` | [EXISTS] |
| Files module (upload entry) | `apps/omnihub-site/dashboard/components/modules/FilesModule.tsx` | [EXISTS] ingest P8 |
| APEX Apps MCP module (prompt-first, OmniPort handoff) | `apps/omnihub-site/dashboard/components/modules/ApexAppsMcpModule.tsx` | [EXISTS] P1 ✓ |

## OmniMedia

| Layer | Path | Status |
|---|---|---|
| Launch widget | `apps/omnihub-site/dashboard/components/media/OmniMediaLaunchWidget.tsx` | [DONE] P9 — catalog-backed, demos opt-in |
| Player | `apps/omnihub-site/dashboard/components/media/OmniMediaPlayer.tsx` | [EXISTS] |
| Gallery (catalog-backed) | `apps/omnihub-site/dashboard/components/media/OmniMediaGallery.tsx` | [DONE] P9 |
| OmniMedia module | `apps/omnihub-site/dashboard/components/modules/OmniMediaModule.tsx` | [DONE] P9 |
| Catalog API client | `apps/omnihub-site/dashboard/lib/omniMediaCatalog.ts` | [DONE] P8/P9 |
| Store | `apps/omnihub-site/src/stores/omniMediaStore.ts` | [DONE] P9 — catalogVersion, mediaError added |
| Files module MIME routing | `apps/omnihub-site/dashboard/components/modules/FilesModule.tsx` | [DONE] P8 — playable→omnimedia-assets |

## Drag/drop & layout

| Layer | Path | Status |
|---|---|---|
| Draggable widget | `apps/omnihub-site/dashboard/DraggableWidget.tsx` | [DONE] rewritten P10 — native pointer capture |
| Layout persistence hook | `apps/omnihub-site/dashboard/hooks/useLayoutPersistence.ts` | [DONE] updated P10 |
| Layout context | `apps/omnihub-site/dashboard/contexts/LayoutContext.tsx` | [DONE] userId added P10 |
| Collision/clamp resolver | `apps/omnihub-site/dashboard/lib/widgetLayout.ts` | [DONE] P10 |
| Widget layout tests | `tests/unit/widgetLayout.test.ts` | [DONE] P10 (18 tests) |
| Layout storage key | `omnidash_layout_v2:{userId}:{breakpoint}` | [DONE] P10 (migrates `omni_widget_pos_*`) |

## i18n

| Layer | Path | Status |
|---|---|---|
| i18n init | `apps/omnihub-site/src/i18n/index.ts` | [EXISTS] |
| Locales (9) | `apps/omnihub-site/src/i18n/locales.ts` | [EXISTS] |
| Persisted key | `localStorage apex_locale` | [EXISTS] |

## Backend / Supabase

| Layer | Path | Status |
|---|---|---|
| Edge router | `supabase/functions/omnilink-port/index.ts` | [EXISTS] extend P5/P7 |
| Shared CORS/preflight | `supabase/functions/_shared/cors.ts` | [EXISTS] |
| Migrations (additive only) | `supabase/migrations/` | [EXISTS] |
| omnihub-files bucket migration | `supabase/migrations/20260531000002_create_omnihub_files_bucket.sql` | [EXISTS] |
| `public.omnimedia_assets` (RLS + owner_user_id) | `supabase/migrations/` (new additive) | [NET-NEW] P7 |
| Private `omnimedia-assets` bucket + policies | `supabase/migrations/` (new additive) | [NET-NEW] P7 |
| Edge routes: omnimedia-catalog / -ingest-from-upload / -register-external / -delete-asset | `omnilink-port/index.ts` | [NET-NEW] P7 |
| Project ref | `supabase/config.toml:1` → `rtopreovkywofgwgmozi` | [EXISTS] |

## Tests, CI & artifacts

| Layer | Path | Status |
|---|---|---|
| E2E suite | `tests/e2e-playwright/` | [EXISTS] |
| Global auth setup | `tests/e2e-playwright/global-setup.ts` | [EXISTS] |
| Global teardown (cleanup) | `tests/e2e-playwright/global-teardown.ts` | [DONE] P12 |
| Auth helper | `tests/e2e-playwright/helpers/auth.ts` | [EXISTS] |
| Modal contract spec | `tests/e2e-playwright/omnidash-modal-contract.spec.ts` | [EXISTS] P2 ✓ |
| Authz access control spec | `tests/e2e-playwright/omnidash-authz.spec.ts` | [DONE] P12 |
| CI runtime gates | `.github/workflows/ci-runtime-gates.yml` | [DONE] P14/15 — k6 rewired to `npm run perf:k6:smoke`, SOFT/main-only |
| k6 smoke script (repo-owned) | `scripts/ci/perf-k6-smoke.mjs` (`npm run perf:k6:smoke`) | [DONE] P14/15 — CI now calls repo-owned script |
| Perf evidence artifact | `artifacts/production-validation/performance-summary.json` | [DONE] P14/15 — uploaded by CI, created at runtime |
| Accepted findings registry | `accepted-findings.md` | [DONE] P14 — APEX-1202 + APEX-2011 registered |
| Feature flag accessor | `apps/omnihub-site/dashboard/lib/featureFlags.ts` | [DONE] P13 — typed `flag()` accessor |
| Diagnostics module | `apps/omnihub-site/dashboard/lib/omnidashDiagnostics.ts` | [DONE] P16 — safe non-sensitive snapshot |
| Diagnostics unit tests | `tests/unit/omnidashDiagnostics.test.ts` | [DONE] P16 (7 tests) |
| Responsive E2E spec | `tests/e2e-playwright/omnidash-responsive.spec.ts` | [DONE] P17 — desktop+mobile viewport |
| Production-safe smoke | `tests/e2e-playwright/production-safe.live.ts` | [EXISTS] — verified P18 |
| Production-safe config | `playwright.production-safe.config.ts` | [EXISTS] — verified P18 |
| RC certification report | `artifacts/production-validation/rc-remediation-certification.md` | [DONE] P19 |

## TradeLine 24/7 decommission (Task 9)

| Layer | Path | Status |
|---|---|---|
| Feature registry route (removed) | `src/features/registry.ts` | [DONE] Task 9 — `apps-tradeline` entry removed |
| Integration registry (removed) | `src/omniconnect/core/registry.ts` | [DONE] Task 9 — TradeLine integration removed |
| KPI types (tradeline fields removed) | `apps/omnihub-site/dashboard/types/dashboard.types.ts` | [DONE] Task 9 |
| KPI types (src, tradeline fields removed) | `src/omnidash/types.ts` | [DONE] Task 9 |
| API column selection (tradeline removed) | `src/omnidash/api.ts` | [DONE] Task 9 |
| KPI redaction (tradeline removed) | `src/omnidash/redaction.ts` | [DONE] Task 9 |
| Dashboard data hook (tradeline removed) | `apps/omnihub-site/dashboard/hooks/useDashboardData.ts` | [DONE] Task 9 |
| KPI table (tradeline columns removed) | `apps/omnihub-site/dashboard/components/Kpis.tsx` | [DONE] Task 9 |
| System health panels (tradeline refs removed) | `apps/omnihub-site/dashboard/components/M03Panels.tsx` | [DONE] Task 9 |
| System health row (rewired to non-TL fields) | `apps/omnihub-site/dashboard/components/SystemHealthRow.tsx` | [DONE] Task 9 |
| Shell demo data (tradeline removed) | `apps/omnihub-site/dashboard/OmniDashShell.tsx` | [DONE] Task 9 |
| Edge function KPI (tradeline queries removed) | `supabase/functions/omnilink-port/index.ts` | [DONE] Task 9 |
| Demo event cache (tradeline metric removed) | `src/lib/demo/TemporalEventCache.ts` | [DONE] Task 9 |
| Responsive E2E (CI-safe rewrite) | `tests/e2e-playwright/omnidash-responsive.spec.ts` | [DONE] Task 9 |
| Decommission contract test | `tests/omnidash/apex-apps-contract.spec.ts` | [EXISTS] — verifies TradeLine NOT in LIVE_APEX_APPS |
| DB columns (additive-only, not dropped) | `supabase/migrations/20251224000002_omnidash.sql` | [KEPT] — no destructive migration |

## Canon & memory

| Layer | Path | Status |
|---|---|---|
| Canonical truth | `memory/omni-recall/docs/architecture/CANONICAL_TRUTH.md` | [EXISTS] |
| Remediation baseline | `memory/omni-recall/production-surface-remediation-baseline.md` | [EXISTS] P0 |
| This path registry | `memory/omni-recall/production-path-registry.md` | [EXISTS] P0 |
| Repo instructions | `AGENTS.md` (25 sections, frontmatter v2.0.2) | [EXISTS] |
| Core protocols / skill routing | `CLAUDE.md` (reconciled to omnidev-apex-pro-v2 on 2026-06-28) | [EXISTS] |
