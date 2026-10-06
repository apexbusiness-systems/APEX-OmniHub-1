---
title: APEX Surface Registry
version: 1.0.0
created: 2026-06-28
source: Generated from live codebase inspection of APEX-OmniHub-main
owner: APEX Business Systems Ltd.
authority: AGENTS.md § 4 Tree Law + § 7 Canonical Surface Ownership
---

# APEX Surface Registry

> **Every agent working in this repo MUST read this file before starting any task.**
> This is the canonical map of every live surface, its file paths, hooks, API routes,
> and database tables. If your task touches a file not in your SCOPE IN, STOP immediately.

---

## ⚠️ GHOST PATH — INSTANT NO-GO

```
src/components/dashboard/
```

**This path is NOT the live OmniDash.** It is a ghost. Any agent editing files here
for OmniDash work is operating on a dead tree. STOP and re-resolve to:

```
apps/omnihub-site/dashboard/
```

This rule is enforced by `AGENTS.md §4 Tree Law`. Violation = automatic NO-GO.

---

## Architecture Overview

| Layer | Fact |
|---|---|
| Framework | React 18 + Vite (SPA) |
| Router | react-router-dom `BrowserRouter` |
| Main entry | `src/App.tsx` re-exports `apps/omnihub-site/src/App.tsx` |
| Live app root | `apps/omnihub-site/` |
| Live OmniDash | `apps/omnihub-site/dashboard/` |
| Auth guard | `apps/omnihub-site/src/components/ProtectedRoute.tsx` |
| Modal system | `apps/omnihub-site/dashboard/components/OmniSpatialHost.tsx` (sole chrome owner) |
| Module renderer | `apps/omnihub-site/dashboard/components/ModuleRenderer.tsx` |
| Backend | Supabase (auth + DB + Edge Functions) |
| Edge router | `supabase/functions/omnilink-port/index.ts` |
| MCP gateway | `src/omnihub-gateway/mcp-client.ts` → `/api/mcp/invoke` |

---

## Post-Auth Surface: OmniDash Shell

**Routes:** `/omnidash`, `/omnidash/*`, `/dashboard`, `/dashboard/*` → all catch-all `*`  
**Auth:** Required — `ProtectedRoute` wraps via `DemoModeProvider` → `OmniDashProvider` → `OmniDashShell`

| File | Role | Fragility |
|---|---|---|
| `apps/omnihub-site/dashboard/OmniDashShell.tsx` | Shell, sidebar nav, header, layout orchestrator | 🔴 CRITICAL |
| `apps/omnihub-site/dashboard/DraggableWidget.tsx` | Native pointer-capture drag/drop system | 🔴 CRITICAL |
| `apps/omnihub-site/dashboard/components/OmniSpatialHost.tsx` | **Sole modal chrome owner** — all modules render inside this | 🔴 CRITICAL |
| `apps/omnihub-site/dashboard/components/ModuleRenderer.tsx` | Dynamic module lazy-loader by `moduleKey` | 🔴 CRITICAL |
| `apps/omnihub-site/dashboard/components/modules/ModuleShell.tsx` | Module content wrapper (title, actions) | 🟡 HIGH |
| `apps/omnihub-site/dashboard/OmniDashShell.tsx` (header region) | OmniDash top bar; there is no separate `TopHeader.tsx` file (verified 2026-09-29) | 🟡 HIGH |
| `apps/omnihub-site/dashboard/contexts/LayoutContext.tsx` | Layout state (userId, panelLayout) | 🟡 HIGH |
| `apps/omnihub-site/dashboard/designSystem.tsx` | Design tokens and shared primitives | 🟡 HIGH |

**Core OmniDash Hooks:**

| Hook | Path | Purpose |
|---|---|---|
| `useDashboardData` | `dashboard/hooks/useDashboardData.ts` | Live system data for shell panels |
| `useLayoutPersistence` | `dashboard/hooks/useLayoutPersistence.ts` | Widget layout persistence (key: `omnidash_layout_v2:{userId}:{breakpoint}`) |
| `useViewport` | `dashboard/hooks/useViewport.ts` | Desktop/mobile breakpoint detection |
| `useOmniModal` | `src/stores/omniModalStore.ts` | Modal open/close/config state |
| `useNotificationStore` | `apps/omnihub-site/src/stores/notificationStore.ts` | Notification feed |
| `useOmniModuleState` | `apps/omnihub-site/src/hooks/useOmniModuleState.ts` | Shared live data hook for all modules |
| `useOmniDashAction` | `apps/omnihub-site/src/hooks/useOmniDashAction.ts` | Module action dispatcher |

**Shell DB Tables:** `subscriptions` (plan/access), `device_registry` (PWA)

**Sidebar Module Keys (contract source of truth):**  
`apps/omnihub-site/src/contracts/omnidash-sidebar-widgets.ts`

Registered sidebar entries: `omniboard`, `physiomni`, `audits`, `links`, `automations`,
`workflows`, `files`, `billing`, `settings`

**FORBIDDEN sidebar labels** (must never appear in sidebar): `OmniSkills`, `Orchestrator`,
`Fortress`, `OmniPort`, `Maestro`, `BYOM`

### 🔒 Canonical Layout Law (owner P1 regression repair — supersedes PR #1516, enforced by CI)

Static guard: `scripts/ci/check-omnidash-integrity.mjs` (`npm run check:omnidash`).
Runtime shield: `tests/e2e-playwright/omnidash-real-user.spec.ts`. Do **not** regress:

- **Top row above the fold:** APEX Agent · OmniSlate · APEX Ecosystem must be fully
  visible on load. OmniSlate's `scrollIntoView` is guarded (`messages.length === 0
  → return`) so it never auto-scrolls the canvas on mount.
- **App Gallery:** four **horizontal** "Awaiting" slots (`repeat(4, minmax(0,1fr))`),
  label "App Gallery", **no Connect affordance**, non-interactive. The Primary
  Metrics / `PrimaryKpiBand` band is **removed** — do not reintroduce it.
- **System Health is retained (owner P1):** `SystemHealthRow` (System Health
  surface, `data-testid="rt_analytics"`) remains a real surface in the **right
  rail** (and in the mobile/tablet Insights drawer). It must **not** be removed as
  a substitute for `SidebarKpiBar`. `SidebarKpiBar` (System KPIs) additionally
  lives in the **left sidebar footer block**. Both coexist.
- **Observability is footer-only (owner P1):** the M-03 observability toggle/panels
  are **removed from the main dashboard canvas**. A `FooterObservabilityRow`
  renders the observability/status strip inside the static `.omni-footer-bar` —
  **fixed, clipped (`overflow:hidden`), and immovable** (never a `DraggableWidget`).
  It is fed by **real shell state**: system health, events tracked, Guardian loops,
  open incidents (queue), and live/demo/sync state — no decorative-only data.
- **Rail + KPI width parity (owner P1):** the left and right rails share one width
  token (`--omni-rail-width`, `.omni-sidebar` + `.omni-right-panel`) and one
  horizontal-inset token (`--omni-rail-pad-x`), defined in
  `apps/omnihub-site/src/styles/omnidash-layout.css` — the stylesheet actually
  imported by the production root entry (`src/main.tsx`, per `index.html`).
  **Do not** redefine these tokens in `apps/omnihub-site/dashboard/omniSkin.css`:
  that file is imported only by the orphaned `apps/omnihub-site/src/main.tsx` and
  never reaches the production bundle (regression found + fixed in PR #1525 —
  the tokens resolved to nothing at runtime and the rails fell back to unequal
  content-sizing). The left `.omni-sidebar-footer` adds **no** horizontal
  padding, so the left System KPIs block (`SidebarKpiBar`) and the right System
  Health/status block (`SystemHealthRow`) have **EXACTLY equal inner content
  width** (rail − 2·`--omni-rail-pad-x`) at every breakpoint. CI verifies the
  tokens against `omnidash-layout.css` specifically (`check-omnidash-integrity.mjs`),
  not `omniSkin.css`.
- **Footer is viewport-fixed (owner P1):** the shell root is a clipped,
  full-viewport-height flex column (`height:100dvh`, `overflow:hidden`) and the
  `.omni-footer-bar` never compresses (`flexShrink:0`), so the footer (copyright +
  observability strip + Guardian) is permanently pinned to the bottom of the
  viewport and does not move when the canvas scrolls.
- **OmniSlate accessibility (owner P1):** the prompt input
  (`data-testid="omnislate-prompt-input"`) and submit (`data-testid="submit-prompt"`)
  must be visible, focusable, and usable. The input row is `flexShrink:0`; the
  message canvas (`flex:1, overflowY:auto`) absorbs height so the input is never
  compressed or clipped.
- **Glass/tile generation (owner P1):** `tailwind.config.ts` content globs **must
  include** `./apps/omnihub-site/dashboard/**/*.{ts,tsx}`. The production entry is
  the ROOT app (`src/main.tsx`); without this glob the dashboard-only Tailwind
  utilities (e.g. OmniMedia gallery tiles `bg-muted/5`, `border-border/20`) are
  never generated and the right-rail/OmniMedia surfaces collapse into plain text.
- **Wallpaper + wordmark:** both `position:fixed` — static, never scroll. The
  wordmark watermark is a non-interactive background (`pointerEvents:none`,
  `zIndex:0`) below content (`zIndex:1`); the labelled product logo lives in the
  header.
- **Canvas brand logo below the App Gallery (owner P1):** a decorative
  (`aria-hidden`) APEX-OmniHub brand mark (`data-testid="omnidash-canvas-logo"`)
  renders **in the content flow directly below the App Gallery** — in-flow and
  non-interactive (`pointerEvents:none`, never a `DraggableWidget`), so it never
  obstructs the App Gallery, rails, OmniSlate, footer, or mobile drawers.
  **Asset (locked, PR #1529):** this mark uses `IMG_APEX_WM`
  (`src/assets/omnidash/apex_omnihub_wordmark.png` — the APEX-OmniHub wordmark),
  the **same** asset as the full-canvas watermark. It is **not** `IMG_WORDMARK`
  (`omnidash-logo.png`, the OmniDash hexagon), which is reserved for the labelled
  **header** product logo (`data-testid="top-header-logo"`). Do not swap them.
- **Glass translucency / no grid bleed (PR #1529):** primary widget cards
  (`GlassCard`, `dashboard/components/designComponents.tsx`) use
  `backdrop-filter: blur(20px) saturate(150%)` (+ `WebkitBackdropFilter`) over the
  **translucent** `--omni-card` / `--omni-card-hover` theme tokens (`theme.css`:
  light `rgba(255,255,255,0.80)`/`(241,245,249,0.84)`, dark
  `rgba(14,22,40,0.78)`/`(17,29,51,0.82)`). App Gallery "Awaiting" tiles
  (`.ose-integrated-apps-slot`, `omniSkin.css`) carry **no element-level
  `opacity`** — the muted/awaiting feel comes from the dashed border + tertiary
  label only, so the blueprint grid never bleeds through a tile. Keep card alpha
  in 0.72–0.88; never opaque (blur needs a translucent surface).
- **Right-rail card uniformity (PR #1529):** the three right-rail widgets —
  `OmniSentryWidget`, **Ops Controls (`SentinelPanel`)**, and
  `OmniMediaLaunchWidget` — share the same glass card chrome
  (`borderRadius:10`, `1px` hairline border, low-alpha fill,
  `backdrop-filter: blur(16px) saturate(140%)`). `SentinelPanel` is wrapped in
  that outer card (its inner `data-testid="rt_ops"` section and `OpsToggle`
  children are unchanged); it must **not** set an explicit width — the rail
  column stretches it to match its siblings.
- **Magnetic widget alignment (PR #1529):** canvas `DraggableWidget`s gain an
  **additive** magnetic-snap layer — `resolveAlignment()` (`lib/widgetLayout.ts`,
  pure, per-axis edge/center snap within `ALIGN_THRESHOLD_PX = 10`) runs in
  `handlePointerUp` **before** `resolveCollisions`, so collision-avoidance keeps
  final say and a snap can never overlap a neighbor. A live orange guide line
  (`rgba(249,115,22,0.45)`, reused singleton overlay) shows during drag and hides
  on release. The long-press state machine, pointer-capture, `resolveCollisions`,
  `persistPosition`, `SNAP_GRID`, and flick-to-set logic are **unchanged**.
- **Language switcher:** surfaced in the OmniDash header (`.omni-header-lang`).

---

## Module Map — All Module Keys → Components → API → DB

All modules open as modal overlays via `OmniSpatialHost` + `ModuleRenderer`.

### MODULE: OmniBoard (Third-Party Integrations)

| Field | Value |
|---|---|
| Module key | `omniboard`, `omniboard-wizard` |
| Component | `apps/omnihub-site/dashboard/components/modules/OmniBoardModule.tsx` |
| Wizard | `apps/omnihub-site/dashboard/components/OmniBoardWizard.tsx` |
| Ownership contract | `apps/omnihub-site/dashboard/contracts/omniSurfaceOwnership.ts` |
| DB tables | `connector_sessions`, `provider_connections`, `omnilink_links` |
| Edge/API | Orchestrator (`ORCHESTRATOR_URL` env var) |
| **OWNS** | Third-party SaaS connections: Salesforce, Slack, GitHub, Stripe, Notion, Google Workspace, HubSpot, etc. |
| **FORBIDDEN** | First-party APEX apps, MCP ecosystem install, media upload, media playback, Files upload |

**Honest Gateway Law:** If `ORCHESTRATOR_URL` is missing → show `BLOCKED-CONFIG`. If unreachable → `BLOCKED-INFRA`. Never fake OAuth or connection success.

---

### MODULE: APEX Apps MCP (First-Party Ecosystem)

| Field | Value |
|---|---|
| Module key | `apex-apps-mcp` |
| Component | `apps/omnihub-site/dashboard/components/modules/ApexAppsMcpModule.tsx` |
| Constant | `APEX_APPS_MODULE_KEY = 'apex-apps-mcp'` (from `omniSurfaceOwnership.ts`) |
| **OWNS** | First-party APEX ecosystem registry, MCP/OmniPort app connect/install flow |
| **FORBIDDEN** | Third-party SaaS provider connections |

**Hard routing rule:** "Add APEX App" → `apex-apps-mcp` ALWAYS. NEVER → `omniboard-wizard`.

---

### MODULE: OmniSkills (public label) / SkillForge (internal only)

| Field | Value |
|---|---|
| Module key | `omniskills` |
| Module component | `apps/omnihub-site/dashboard/components/modules/OmniSkillsModule.tsx` |
| Forge panel | `apps/omnihub-site/dashboard/components/modules/OmniSkillsForgePanel.tsx` |
| Protected route | `apps/omnihub-site/src/pages/Launch/SkillForge.tsx` → `/launch/skillforge` |
| Hook | `useOmniModuleState` |
| Edge fn | `supabase.functions.invoke('generate-business-skills', ...)` |
| DB tables | `user_generated_skills`, `agent_skills`, `skill_matches` |
| **NAMING RULE** | Public-facing label = **OmniSkills**. "SkillForge" = internal only. NEVER expose "SkillForge" in UI copy. Enforced by `scripts/ci/check-omniskills-rebrand.mjs`. |

---

### MODULE: APEX Agent (Voice)

| Field | Value |
|---|---|
| Module key | `agent` |
| Component | `apps/omnihub-site/dashboard/components/modules/AgentModule.tsx` |
| Avatar | `apps/omnihub-site/dashboard/components/ApexAgentAvatar.tsx` |
| Gateway | `src/omnihub-gateway/mcp-client.ts` → `POST /api/mcp/invoke` |
| Edge fn | `functions/api/mcp/invoke.ts` |
| DB tables | `agent_runs`, `agent_events`, `agent_checkpoints`, `agent_memories`, `tool_invocations` |
| Allowed providers | `groq`, `anthropic` ONLY |
| **FORBIDDEN providers** | `openai`, `xai`, `google`, `gemini`, `gpt*` — must be cleared from sessionStorage |
| Canonical name | **APEX Agent** (not OmniLink Agent) |

---

### MODULE: OmniMedia

| Field | Value |
|---|---|
| Module key | `omnimedia` |
| Module component | `apps/omnihub-site/dashboard/components/modules/OmniMediaModule.tsx` |
| Gallery | `apps/omnihub-site/dashboard/components/media/OmniMediaGallery.tsx` |
| Player | `apps/omnihub-site/dashboard/components/media/OmniMediaPlayer.tsx` |
| Launch widget | `apps/omnihub-site/dashboard/components/media/OmniMediaLaunchWidget.tsx` |
| Global dock | `apps/omnihub-site/dashboard/components/media/GlobalMediaDock.tsx` |
| Catalog client | `apps/omnihub-site/dashboard/lib/omniMediaCatalog.ts` |
| Store | `apps/omnihub-site/src/stores/omniMediaStore.ts` |
| Edge fns | `omnilink-port/omnimedia-catalog`, `omnilink-port/omnimedia-ingest-from-upload`, `omnilink-port/omnimedia-delete-asset` |
| DB table | `omnimedia_assets` (`kind ∈ {video, audio, image}`) |
| Media kinds | **video · audio · image** (image added PR #1516); fed by Files via `getPlayableMediaKind` |
| Upload caps | **server-side** in `omnimedia-ingest-from-upload`: 5 uploads / 24h, 25 MB total per user (`429` on breach) |
| **OWNS** | Media catalog, gallery, playback, ingestion, uploaded media metadata |
| **FORBIDDEN** | Hardcoded demo clips, Big Buck Bunny, Elephants Dream, hardcoded arrays, YouTube-only playback, client-only upload caps |

---

### MODULE: Files

| Field | Value |
|---|---|
| Module key | `files` |
| Component | `apps/omnihub-site/dashboard/components/modules/FilesModule.tsx` |
| Local DB | `apps/omnihub-site/src/lib/localFilesDB.ts` |
| DB table | `omnimedia_assets` (playable MIME types route here) |
| **OWNS** | File upload, file management, general storage |
| **MAY FEED** | OmniMedia (when uploaded file is playable media) |
| **FORBIDDEN** | Third-party connections, app install |

---

### MODULE: Links

| Field | Value |
|---|---|
| Module key | `links` |
| Component | `apps/omnihub-site/dashboard/components/modules/LinksModule.tsx` |
| Auth | `supabase.auth.getSession()` (JWT required before insert) |
| DB table | `omnilink_links` (direct Supabase insert) |

---

### MODULE: PhysiOmni

| Field | Value |
|---|---|
| Module key | `physiomni` |
| Component | `apps/omnihub-site/dashboard/components/modules/PhysiOmniModule.tsx` |
| Access gate | `PhysiOmniGate` component + `usePlan` hook (plan-gated) |
| Auth | `supabase.auth.getUser()` |
| DB tables | `physiomni_devices`, `physiomni_telemetry`, `physiomni_alerts`, `physiomni_baselines`, `physiomni_device_commands` |
| Organism label | PhysiOmni = **Hands + Feet** (Enterprise tier) |

---

### MODULE: Workflows

| Field | Value |
|---|---|
| Module key | `workflows` |
| Component | `apps/omnihub-site/dashboard/components/modules/WorkflowsModule.tsx` |
| Hook | `useOmniModuleState` |
| Edge fn | `supabase.functions.invoke('trigger-workflow', ...)` |
| DB tables | `workflows`, `workflow_runs` |

---

### MODULE: Automations

| Field | Value |
|---|---|
| Module key | `automations` |
| Component | `apps/omnihub-site/dashboard/components/modules/AutomationsModule.tsx` |
| Hook | `useOmniModuleState` |
| Edge fn | `supabase.functions.invoke('execute-automation', ...)` |
| DB tables | `omni_runs`, `omni_run_events` |

---

### MODULE: Billing

| Field | Value |
|---|---|
| Module key | `billing` |
| Component | `apps/omnihub-site/dashboard/components/modules/BillingModule.tsx` |
| Edge fn | `supabase.functions.invoke('create-billing-portal', ...)` |
| DB table | `subscriptions` |

---

### MODULE: Settings

| Field | Value |
|---|---|
| Module key | `settings` |
| Component | `apps/omnihub-site/dashboard/components/modules/SettingsModule.tsx` |
| Auth | `supabase.auth.getUser()` |
| Hooks | `useTheme` (`dashboard/hooks/useTheme.ts`), `useLayoutContext` (`dashboard/contexts/LayoutContext.tsx`) |
| Widget config | `apps/omnihub-site/dashboard/components/WidgetSettingsModal.tsx` |

---

### MODULE: Translation / Language

| Field | Value |
|---|---|
| Module key | `translation` |
| Component | `apps/omnihub-site/dashboard/components/modules/TranslationModule.tsx` |
| i18n init | `apps/omnihub-site/src/i18n/index.ts` |
| Locales | `apps/omnihub-site/src/i18n/locales.ts` (9 locales) |
| Persistence | `localStorage: apex_locale` |
| **LAW** | Language switcher MUST be visible on OmniDash — not buried in an obscure flow |

---

### MODULE: OmniTrace

| Field | Value |
|---|---|
| Module key | `omnitrace` |
| Component | `apps/omnihub-site/dashboard/components/modules/OmniTraceModule.tsx` |
| Feed widget | `apps/omnihub-site/dashboard/components/OmniTraceFeed.tsx` |
| Hook | `src/hooks/useOmniTrace.ts` |
| DB tables | `omni_run_events`, `audit_logs` |

---

### MODULE: Audits

| Field | Value |
|---|---|
| Module key | `audits` |
| Component | `apps/omnihub-site/dashboard/components/modules/AuditsModule.tsx` |
| DB table | `audit_logs` |

---

### MODULE: Dashboard (Overview Canvas)

| Field | Value |
|---|---|
| Module key | `dashboard` |
| Component | `apps/omnihub-site/dashboard/components/modules/DashboardModule.tsx` |
| Main canvas | `apps/omnihub-site/dashboard/components/DashboardOverview/DashboardOverview.tsx` |
| Sub-components | `AgentPane.tsx`, `OmniSlatePane.tsx`, `EcosystemPane.tsx`, `AppsSection.tsx`, `RecordButton.tsx` |
| Hooks | `useAppRegistryHealth`, `useOmniDashAction`, `useOmniGateway`, `useOmniSlateStore`, `useAgentRecording` |
| API | `fetchOmniLinkIntegrations(userId)` from `src/omnidash/omnilink-api` |
| Realtime | Supabase realtime channel subscription |

---

### MODULE: Integrations

| Field | Value |
|---|---|
| Module key | `integrations` |
| Component | `apps/omnihub-site/dashboard/components/modules/IntegrationsModule.tsx` |
| Note | Coordination surface — routes to OmniBoard (3rd-party) or APEX Apps (1st-party) per ownership contract |

---

### MODULE: MAN Mode

| Field | Value |
|---|---|
| Module key | Inline in `OmniDashShell.tsx` (ManModeReviewQueue panel) |
| Hook | `apps/omnihub-site/src/hooks/useManMode.ts` |
| Approval bridge | `apps/omnihub-site/src/hooks/useMCPApprovalBridge.ts` |
| API | `GET /api/man-mode/approvals` (polled every 10s) |
| DB tables | `man_tasks`, `man_notifications` |

---

## Pre-Auth Public Surfaces (Marketing Site)

These are **read-only** from the agent's perspective unless explicitly tasked to modify them.

| Route | Component | Notes |
|---|---|---|
| `/` | `apps/omnihub-site/src/pages/Home.tsx` | Public landing |
| `/auth`, `/login` | `apps/omnihub-site/src/pages/Login.tsx` | Auth entry — HIGH FRAGILITY |
| `/launch` | `apps/omnihub-site/src/pages/Launch/OnboardingWizard.tsx` | Calls `activate-client`, `create-checkout`, `generate-business-skills` |
| `/launch/skillforge` | `apps/omnihub-site/src/pages/Launch/SkillForge.tsx` | Protected — calls `generate-business-skills` |
| `/product/omnidash` | `apps/omnihub-site/src/pages/product/OmniDash.tsx` | Marketing page for OmniDash |
| `/story` | `apps/omnihub-site/src/pages/FounderStory.tsx` | — |
| `/demo` | `apps/omnihub-site/src/pages/Demo.tsx` | — |
| `/tech-specs` | `apps/omnihub-site/src/pages/TechSpecs.tsx` | — |
| `/manifesto`, `/apex-manifesto` | `apps/omnihub-site/src/pages/Manifesto.tsx` | — |
| `/privacy`, `/terms` | `Privacy.tsx`, `Terms.tsx` | Legal — do not edit |
| `/omni-sentry` | `apps/omnihub-site/src/pages/OmniSentry.tsx` | — |
| `/omni-trace` | `apps/omnihub-site/src/pages/OmniTrace.tsx` | — |
| `/physiomni-pilot` | `apps/omnihub-site/src/pages/PhysiOmniPilot.tsx` | — |
| `/fortress` | `apps/omnihub-site/src/pages/Fortress.tsx` | — |
| `/maestro` | `apps/omnihub-site/src/pages/Maestro.tsx` | — |
| `/tri-force` | `apps/omnihub-site/src/pages/TriForce.tsx` | — |

---

## Shared Infrastructure (Touch With Extreme Care)

| Path | Role | Guard |
|---|---|---|
| `apps/omnihub-site/src/lib/supabase.ts` | Core Supabase client | Do not modify client config without explicit auth task |
| `apps/omnihub-site/src/lib/useAuth.ts` | Auth hook | Do not modify without explicit auth task |
| `apps/omnihub-site/src/components/ProtectedRoute.tsx` | Auth guard | Do not modify without explicit auth task |
| `src/lib/auth/` | Auth utilities | Do not modify without explicit auth task |
| `apps/omnihub-site/dashboard/contracts/omniSurfaceOwnership.ts` | Surface ownership canon | Do not modify — drives routing law across the entire app |
| `apps/omnihub-site/src/contracts/omnidash-sidebar-widgets.ts` | Sidebar widget registry | Do not add/remove entries without explicit contract task |
| `apps/omnihub-site/dashboard/components/OmniSpatialHost.tsx` | Sole modal chrome owner | No nested shells, no duplicate close buttons, no bypass |
| `apps/omnihub-site/src/providers/OmniDashProvider.tsx` | OmniDash context provider | Do not break provider chain |
| `src/omnihub-gateway/mcp-client.ts` | MCP gateway | Provider allowlist enforced here — do not add providers |
| `apps/omnihub-site/src/App.tsx` | SPA router | All routes defined here — do not add routes outside this file |

---

## Edge Functions (Supabase)

| Function | Caller | Triggered By |
|---|---|---|
| `omnilink-port/index.ts` | `useOmniModuleState` | Main edge router — all module state |
| `omnilink-port/omnimedia-catalog` | `omniMediaCatalog.ts` | OmniMedia gallery load |
| `omnilink-port/omnimedia-ingest-from-upload` | `omniMediaCatalog.ts` | File → OmniMedia pipeline |
| `omnilink-port/omnimedia-delete-asset` | `omniMediaCatalog.ts` | OmniMedia delete |
| `trigger-workflow` | `WorkflowsModule`, `DashboardOverview` | Workflow execution |
| `execute-automation` | `AutomationsModule` | Automation run |
| `generate-business-skills` | `OmniSkillsForgePanel`, `OnboardingWizard`, `SkillForge` | Skill generation |
| `create-billing-portal` | `BillingModule` | Billing portal redirect |
| `activate-client` | `OnboardingWizard` | New user activation |
| `create-checkout` | `OnboardingWizard` | Stripe checkout |
| `identity-webauthn` | `apps/omnihub-site/src/lib/webauthnClient.ts` | WebAuthn registration/auth |
| `byom-login` | `ConnectAiAuthModal` | BYOM provider auth |
| `byom-proxy` | `EyesVisionInput` | BYOM AI proxy |
| `functions/api/mcp/invoke.ts` | `mcp-client.ts` | MCP tool invocation |
| `functions/api/omnibridge/ingest.ts` | OmniBridge pipeline | Event ingest |
| `functions/api/omnibridge/sync.ts` | OmniBridge pipeline | Event sync |

---

## ☢️ UNIVERSAL DO-NOT-TOUCH LIST

These files/directories MUST NOT be modified unless the task **explicitly** names them:

```
supabase/migrations/           — NEVER touch without explicit DB migration task
.github/workflows/             — NEVER touch without explicit CI/CD task
apps/omnihub-site/src/lib/supabase.ts        — Core client — auth task only
apps/omnihub-site/src/lib/useAuth.ts         — Auth hook — auth task only
src/lib/auth/                  — Auth utilities — auth task only
apps/omnihub-site/dashboard/contracts/omniSurfaceOwnership.ts  — Ownership canon — contract task only
apps/omnihub-site/src/contracts/omnidash-sidebar-widgets.ts    — Sidebar registry — contract task only
apps/omnihub-site/dashboard/components/OmniSpatialHost.tsx     — Modal system — modal task only
src/omnihub-gateway/mcp-client.ts            — Gateway client — gateway task only
apps/omnihub-site/src/App.tsx                — Router — routing task only
```

**Files with `// APEX SURFACE LOCK — DO NOT MODIFY` comment: treat as read-only.**

---

## Wiring Map Summary

| Surface | Module Key | Component | Primary Hook | Edge Fn / API | DB Table(s) |
|---|---|---|---|---|---|
| OmniDash Shell | — | `OmniDashShell.tsx` | `useDashboardData`, `useLayoutPersistence` | — | `subscriptions` |
| OmniBoard | `omniboard` | `OmniBoardModule.tsx` | `useOmniModuleState` | Orchestrator URL | `connector_sessions`, `provider_connections` |
| APEX Apps MCP | `apex-apps-mcp` | `ApexAppsMcpModule.tsx` | `useOmniModuleState` | `/api/mcp/invoke` | — |
| OmniSkills | `omniskills` | `OmniSkillsModule.tsx` | `useOmniModuleState` | `generate-business-skills` | `user_generated_skills`, `agent_skills` |
| APEX Agent | `agent` | `AgentModule.tsx` | `useOmniDashAction` | `/api/mcp/invoke` | `agent_runs`, `agent_events` |
| OmniMedia | `omnimedia` | `OmniMediaModule.tsx` | `omniMediaCatalog.ts` | `omnimedia-catalog`, `omnimedia-ingest` | `omnimedia_assets` |
| Files | `files` | `FilesModule.tsx` | — | — | `omnimedia_assets`, localFilesDB |
| Links | `links` | `LinksModule.tsx` | — | Supabase direct | `omnilink_links` |
| PhysiOmni | `physiomni` | `PhysiOmniModule.tsx` | `usePlan` | Supabase direct | `physiomni_devices`, `physiomni_telemetry` |
| Workflows | `workflows` | `WorkflowsModule.tsx` | `useOmniModuleState` | `trigger-workflow` | `workflows`, `workflow_runs` |
| Automations | `automations` | `AutomationsModule.tsx` | `useOmniModuleState` | `execute-automation` | `omni_runs` |
| Billing | `billing` | `BillingModule.tsx` | — | `create-billing-portal` | `subscriptions` |
| Settings | `settings` | `SettingsModule.tsx` | `useTheme`, `useLayoutContext` | Supabase auth | — |
| Translation | `translation` | `TranslationModule.tsx` | i18n | — | `localStorage: apex_locale` |
| OmniTrace | `omnitrace` | `OmniTraceModule.tsx` | `useOmniTrace` | — | `omni_run_events`, `audit_logs` |
| Audits | `audits` | `AuditsModule.tsx` | `useOmniModuleState` | — | `audit_logs` |
| MAN Mode | inline | OmniDashShell panels | `useManMode` | `/api/man-mode/approvals` | `man_tasks`, `man_notifications` |

---

## Organism Naming Canon

| Organism | Name | Role |
|---|---|---|
| Brain | OmniHub | Core platform |
| Eyes | OmniDash | Dashboard / control surface |
| Hands + Feet | PhysiOmni | Enterprise physical integrations |
| Voice | APEX Agent | Agent / voice interface |
| AppShell | OmniLink | App shell / integration layer |

---

## Ownership Routing Rules (Enforced by Contract)

```
Add APEX App       → moduleKey: 'apex-apps-mcp'       ✅ CORRECT
Connect SaaS App   → moduleKey: 'omniboard-wizard'     ✅ CORRECT
Add APEX App       → moduleKey: 'omniboard-wizard'     ❌ FORBIDDEN
Connect SaaS App   → moduleKey: 'apex-apps-mcp'        ❌ FORBIDDEN
```

Source: `apps/omnihub-site/dashboard/contracts/omniSurfaceOwnership.ts`

---

## CI Guards (Do Not Break These)

| Script | What It Enforces |
|---|---|
| `scripts/ci/check-omnidash-integrity.mjs` | OmniDash structural invariants |
| `scripts/ci/check-omniskills-rebrand.mjs` | "SkillForge" never appears in public UI |
| `scripts/ci/check-pwa-integrity.mjs` | `PWAInstallBanner` stays in `App.tsx` |
| `scripts/ci/guard-agent-destructive-actions.mjs` | Blocks destructive agent operations |
| `scripts/ci/check-additive-migrations.ts` | Migrations must be additive only |
| `scripts/ci/verify-supabase-env-alignment.mjs` | Supabase config alignment |

---

*Last generated: 2026-06-28 from live codebase inspection.*  
*Updated 2026-07-04 → release `1.8.3` (PR #1529 — OmniDash surface fix pass): canvas-logo asset*
*locked + enlarged/faded (`height:92, opacity:0.16`); glass-translucency / no-grid-bleed contract*
*(`--omni-card` tokens +20% translucent: light 0.96, dark 0.936); ALL rail + sidebar glassmorph*
*tiles unified — OmniTrace, OmniSentry, Ops Controls, OmniMedia, System Status (newly wrapped), and*
*sidebar System KPIs share one orange border `rgba(249,115,22,0.25)` + one fill opacity `0.06` + blur;*
*additive magnetic widget alignment (`resolveAlignment` before `resolveCollisions`). OmniMedia*
*VALIDATED_FUNCTIONING — player proven; production backend confirmed (omnilink-port deployed,*
*`omnimedia_assets` RLS + 4 policies, catalog empty pending owner upload).*
*Frozen baseline + reproduction: `memory/omni-recall/omnidash-surface-1.8.3-baseline-2026-07-04.md`.*
*Evidence: `docs/audits/omnidash-surface-alignment-glass-2026-06-30.md` (the report is dated 2026-07-04 inside; the file name carries 2026-06-30).*  
*Update this file whenever surface ownership, module keys, paths, or DB tables change.*  
*Canonical source files: `AGENTS.md`, `apps/omnihub-site/src/App.tsx`, `dashboard/contracts/omniSurfaceOwnership.ts`, `src/contracts/omnidash-sidebar-widgets.ts`, `dashboard/components/ModuleRenderer.tsx`*
