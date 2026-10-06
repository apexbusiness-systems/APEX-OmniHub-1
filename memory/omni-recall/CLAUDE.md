---
version: 1.2.0
last_audited: 2026-09-29
status: verified
---

# Omni-Recall — Claude Code Runtime Adaptation

- Purpose: persistent continuity system for knowledge, preferences, corrections, and project memory.
- Canonical root: `memory/omni-recall/` (within the APEX-OmniHub repo)
- Installed: 2026-05-23 on branch `claude/optimistic-mccarthy-w982b`

## Multi-Agent Environment (verified 2026-06-02)

- This repo receives commits from **multiple AI agents**, not only Claude Code:
  **Google Jules, Google Antigravity, OpenAI Codex, and Dependabot** all commit here.
- Do **not** assume Claude authored a given commit, branch, or current state.
- The root `CLAUDE.md` can lag reality (other agents move `main`); treat its
  commit/date facts as hints and verify HEAD with `git log` before relying on them.
- Audit (2026-09-29): Claude Code cloud session (revenue-contract APEX-REV-2026-09, then documentation sync). Verified HEAD: `main` @ `6c62fdb8`. Release line `1.8.3` with **no release cut since 2026-08-23**; 23 workflows, 35 edge function dirs (34 functions + `_shared`), 116 forward + 10 rollback migrations (git-verified). Owner-issued standing rules from this period: production edge functions deploy only from CI on `main` by manual, reviewer-gated dispatch; migrations are applied by the owner, in order, only what is on `main`; merged is not live (web builds auto-deploy on merge, functions and migrations do not); one PR open at a time from the designated branch; re-check a PR against every decision issued since it was opened before calling it ready. Current state: `docs/CURRENT_PLATFORM_STATE_2026_09_29.md`. **Skill routing:** root `CLAUDE.md` is the authority (`apex-boost-claude`, `apex-master-debug-claude`, `omnidev-apex-pro-v2`; `apex-dev` superseded).
- Audit (2026-07-06): Google Antigravity session. Pushed commits to branch `apex/omnihub/20260706-omniboard-integrations-9f766361`. Verified 0 ESLint warnings workspace-wide (complying with Gate 2). Extended relaxed rule files in `eslint.config.js` to include `apps/omnihub-site/tests/**/*.{ts,tsx}` and removed the unused `expect` import from `omniboard-integrations.spec.ts`. All 3081 unit, integration, and quality tests passed cleanly.
- Audit (2026-07-04): active dev branch `claude/omnidash-surface-alignment-fsrs31` (PR #1529, OmniDash surface fix pass). **Release line bumped `1.8.2`→`1.8.3`** (patch; UI/glassmorphism refinements, no API/schema/env change). Surface RELEASE-READY: 726 OmniDash tests green, `check:omnidash` 37/37, `check:omni-skin` 6/6, typecheck/build green. OmniMedia VALIDATED_FUNCTIONING — player proven (real media decoded + time-advancing) + production backend confirmed via Supabase Management API (`omnilink-port` deployed; `omnimedia_assets` RLS + 4 policies; catalog empty pending owner upload). Frozen baseline: `omnidash-surface-1.8.3-baseline-2026-07-04.md`. `main` head not re-verified this session (on a feature branch). Owner cuts the final gate by merging the PR.
- Verified HEAD at this audit (2026-06-25): `main` HEAD `4c0d481` (PR #1488, chore(cert): Production Hardening Sprint & Codebase Determinism); active dev branch `claude/kind-feynman-h5gcbs` @ `6074e0c` (fix(ci): integration-harness playwright hang). Release line `1.8.2`. **Skill routing updated:** root `CLAUDE.md` now routes to `apex-boost-claude`, `apex-master-debug-claude`, `omnidev-apex-pro-1.0.0` (now the same workflow as `omnidev-apex-pro-v2`; use the `v2` name) — `apex-dev` is superseded. Workflow count corrected to 20; edge function dir count corrected to 33.
- Prior audit (2026-06-24, Session 3): `main` HEAD `8bfb1a6` (PR #1486, fix(sonar) omnihub-site code-smell closure); development branch tracks `main` at the same commit; no open PRs. Release line `1.8.2` (`package.json` bumped). Release cut is **manual / owner-driven** (`changeset version` → `chore: version packages`); CI validates, `compliance.yml` attaches SBOM **attach-only** (gated on the tag already existing, so CI can never create a tag — resolved 2026-06-24). Owner-approved cert: `docs/release/owner-approved/PRODUCTION_CERTIFICATION_2026_06_24.md`.
- Prior audit (2026-06-22): working branch `claude/focused-ptolemy-dgd054`; Main HEAD `1f22570`. Release line `1.8.1`, `1.8.2` in progress. Superseded.
- Prior audit (2026-06-21): `8772015e` (v1.8.1 release cut); branch `claude/dreamy-albattani-fw93y3`.

## Runtime Facts (Claude Code / ephemeral container)

- Persistence mechanism: git commits + push to `origin`. The repo IS the workspace.
- Session-load pointer: the repo root `AGENTS.md` read order (item 10) points here; the root `CLAUDE.md` no longer references this system (its old §29 is gone), so load this directory explicitly via `start-here.md`.
- No persistent `/workspace/memory/` — that path is from the GPT-origin blueprint and does not apply here.
- No always-on background hooks. Automation is via Claude Code settings hooks only.

## Operating Rules

- Use raw evidence first, compiled wiki second, user-operating rules third.
- Treat `raw/` as immutable source material.
- Treat `wiki/` as AI-maintained canonical knowledge.
- Prefer concise, linked markdown pages over long narrative dumps.
- Keep claims traceable to raw evidence, repo evidence, tool evidence, or explicit user statements.
- Never imply hidden access to full account history, model weights, or always-on hooks.
- Retroactive backfill only from available exports, uploads, repos, and connected tools.
- If historical data is missing, say so plainly and mark backfill pending.
- Capture meaningful corrections in `wiki/corrections/` and promote stable ones to directives or `user-operating-model.md`.
- Separate verified fact from inference and claimed-but-unverified evidence.
- Default timezone: `America/Edmonton`. Use absolute dates when clarity matters.
- Optimize for "wind, not dashboard": quiet by default, surface only real drift, conflict, risk, or decisions.
- Deduplicate aggressively; update canonical pages instead of spawning near-duplicates.
- Do not overwrite raw evidence to "clean it up."

## Common Failure Modes to Avoid

- pretending inaccessible history was ingested
- storing temporary preferences as permanent rules
- mixing audit claims with verified system truth
- repeating corrected framing
- producing noisy status output without need
