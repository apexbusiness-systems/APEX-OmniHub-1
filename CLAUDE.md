---
version: 1.2.0
last_audited: 2026-08-23
status: verified
---

# APEX-OMNIHUB CORE PROTOCOLS
- **Modularity:** Maximum file length is 600 lines. Break large files into single-responsibility modules.
- **Architectural Literacy:** Account for state management, race conditions, and concurrent database locks. Do not assume syntax covers architecture.
- **Execution Loop:** One task per session. Test manually. Push to GitHub immediately on pass. Revert immediately on fail. No hallucination cascading.
- **Goal:** Zero Marginal Cost Distribution. "Intelligence Designed."

## Canonical Skill Routing (Updated 2026-06-25)

**Do NOT invoke `apex-dev`.** It is superseded. Use the following skills instead:

| Task | Skill to invoke |
|---|---|
| General APEX development, features, architecture, OmniHub/OmniDash/OmniLink work | `apex-boost-claude` |
| Debugging, bug fixing, error diagnosis, stack traces, failing tests, pre-release audit | `apex-master-debug-claude` |
| Full platform dev/debug/repair/optimization — live Supabase/Cloudflare/edge access | `omnidev-apex-pro-v2` |

All three skills are in `.claude/skills/`. Invoke via the `Skill` tool with the exact skill name above.

## OmniDash Canonical Layout Law (owner P1 regression repair — supersedes PR #1516, DO NOT REGRESS)

The approved OmniDash shell layout is locked and CI-enforced. Before changing
`apps/omnihub-site/dashboard/OmniDashShell.tsx`, read the full record in
`APEX_SURFACE_REGISTRY.md` ("Canonical Layout Law").

- **Static guard:** `npm run check:omnidash` (`scripts/ci/check-omnidash-integrity.mjs`).
- **Runtime shield:** `tests/e2e-playwright/omnidash-real-user.spec.ts`.
- **OSE/root-entry warning:** do **not** assume `apps/omnihub-site/src/main.tsx` is
  the production entry. `index.html` loads the production root `src/main.tsx`.
  `npm run check:omnidash` owns runtime layout-token proof, including the
  `src/main.tsx` import of `apps/omnihub-site/src/styles/omnidash-layout.css`;
  `npm run check:omni-skin` owns static OmniSkin token hygiene only and does not
  prove `omniSkin.css` reaches production.

Locked invariants: top row (Agent/Slate/Ecosystem) above the fold (OmniSlate
`scrollIntoView` guarded on mount); App Gallery = four horizontal "Awaiting" slots,
no Connect, no Primary Metrics band. **System Health is retained** —
`SystemHealthRow` (`rt_analytics`) stays a real surface in the right rail (and the
mobile Insights drawer); it is **not** removed as a substitute for `SidebarKpiBar`
(System KPIs in the left sidebar footer) — both coexist. **Observability is
footer-only** — the M-03 toggle/panels are removed from the main canvas;
`FooterObservabilityRow` renders inside the static `.omni-footer-bar`, fixed,
clipped (`overflow:hidden`), immovable (never a `DraggableWidget`), fed by real
shell state (health, events, Guardian loops, open incidents, sync/mode). Left and
right rails share one width token (`--omni-rail-width`) **and** one horizontal-inset
token (`--omni-rail-pad-x`), and `.omni-sidebar-footer` adds no horizontal padding,
so `SidebarKpiBar` (left) and `SystemHealthRow` (right) have **exactly equal inner
content width** (rail − 2·`--omni-rail-pad-x`) at every breakpoint. The **footer is
viewport-fixed**: the shell root is a clipped `100dvh` flex column and
`.omni-footer-bar` is `flexShrink:0`, so the footer is pinned to the viewport bottom
and never moves on canvas scroll. OmniSlate prompt input/submit must stay visible,
focusable, and uncompressed. `tailwind.config.ts` content **must** scan
`apps/omnihub-site/dashboard/**` so dashboard tile/glass utilities are generated
(else OmniMedia/right rail collapse to plain text). Wallpaper grid + wordmark
`position:fixed` (wordmark is a non-interactive `pointerEvents:none` background
below content); a decorative `aria-hidden` brand logo
(`data-testid="omnidash-canvas-logo"`) renders **in-flow directly below the App
Gallery** (never a `DraggableWidget`, never obstructs other surfaces); language
switcher in the header. OmniMedia `kind ∈
{video,audio,image}`, Files-fed, with **server-side** upload caps (5/24h, 25 MB
total). Breaking any invariant fails CI — fix the change, not the guard.

### Canonical dev/debug workflow alias

`omnidev-apex-pro-v2` is the canonical full-platform dev/debug workflow. This matches
`AGENTS.md` frontmatter (`canonical_dev_workflow: omnidev-apex-pro-v2`).

**Alias note:** the skill ships at `.claude/skills/omnidev-apex-pro-v2/` (and a mirror under
`.agents/protocols/omnidev-apex-pro-v2/`), but its `SKILL.md` `name:` field is the historical
`omnidev-apex-pro-native`. Treat `omnidev-apex-pro-v2`, `omnidev-apex-pro-native`, and the
retired `omnidev-apex-pro-1.0.0` as the **same** workflow; always prefer the `v2` identifier.
Do **not** invoke the superseded `apex-dev`.
