---
name: apex-standards
description: "Core APEX engineering standards, ARMAGEDDON L8 certification gates, Organism naming canon, minimal-diff constraints, and Canonical ICC task lifecycle workflows for Antigravity agents."
metadata:
  version: "1.0.0"
  author: "APEX Business Systems LTD"
  status: "active"
  platform: "Google Antigravity IDE"
---

# APEX-Standards Skill

Production engineering authority, architectural canon, and task lifecycle protocols for APEX Business Systems LTD products (APEX-OmniHub, aSpiral, DueRadar, PlayMoney, CheapStays, Jubee.Love, FLOW Bills, Armageddon Test Suite).

---

## 1. Execution Contracts & Canonical Truth References

Do not duplicate or fork execution contracts. Always reference and adhere to the single sources of truth in their established priority hierarchy:

1. **Executive / Active Contract**: Current execution contract supplied by APEX leadership.
2. **Canonical Truth Architecture**: [`memory/omni-recall/docs/architecture/CANONICAL_TRUTH.md`](file:///c:/Users/sinyo/APEX-OmniHub/APEX-OmniHub/memory/omni-recall/docs/architecture/CANONICAL_TRUTH.md)
3. **Repository Instructions & Surface Canon**: [`AGENTS.md`](file:///c:/Users/sinyo/APEX-OmniHub/APEX-OmniHub/AGENTS.md)
4. **Platform & Agent Directives**: [`CLAUDE.md`](file:///c:/Users/sinyo/APEX-OmniHub/APEX-OmniHub/CLAUDE.md)
5. **Canonical Dev/Debug Workflow**: `omnidev-apex-pro-v2` / [`.claude/skills/omnidev-apex-pro-v2/SKILL.md`](file:///c:/Users/sinyo/APEX-OmniHub/APEX-OmniHub/.claude/skills/omnidev-apex-pro-v2/SKILL.md)
6. **Path Registry & Baseline**: [`memory/omni-recall/production-path-registry.md`](file:///c:/Users/sinyo/APEX-OmniHub/APEX-OmniHub/memory/omni-recall/production-path-registry.md) and [`memory/omni-recall/production-surface-remediation-baseline.md`](file:///c:/Users/sinyo/APEX-OmniHub/APEX-OmniHub/memory/omni-recall/production-surface-remediation-baseline.md)
7. **OmniDash Contract Workflow**: [`.agents/workflows/omnidash-contract.md`](file:///c:/Users/sinyo/APEX-OmniHub/APEX-OmniHub/.agents/workflows/omnidash-contract.md)

---

## 2. Organism Naming Canon

Agents must never mislabel or conflate platform components. The biological organism taxonomy is strictly mapped as follows:

| Component | Organism Role | Definition & Boundary | Canonical Path / Scope |
| :--- | :--- | :--- | :--- |
| **OmniHub** | **Brain** | Authenticated AI orchestration control plane, central intelligence, state vectors, FSM dispatch, and persistence. | Root platform & `supabase/functions/` |
| **OmniDash** | **Eyes** | Live visual workspace, viewport rendering, widget canvas, monitoring, telemetry visibility, real-time layout. | `apps/omnihub-site/dashboard/` |
| **PhysiOmni** | **Hands + Feet** | Physical world actuation, hardware interfaces, robotics, IoT telemetry, real-world execution. | `apps/omnihub-site/dashboard/components/modules/physiomni/` |
| **APEX Agent** | **Voice** | Conversational multi-agent interface, voice/chat synthesis, human-in-the-loop dialogue, prompt interaction. | APEX Agent Operations & Voice Services |
| **OmniLink** | **AppShell** | Application shell, host container, spatial environment (`OmniSpatialHost`), cross-app bridge, container runtime. | `apps/omnihub-site/src/` & Shell layer |

---

## 3. Core Laws & Hard Constraints

### 3.1 ARMAGEDDON Certification Bar (Current: L8 Gate)
- **Status**: Non-negotiable hard gate on all code merges.
- **Rule**: If it is not deterministic, it is a bug.
- **Requirement**: No task is complete without fresh machine-verifiable evidence in the current session.
- **Standards**:
  - Full TypeScript strict mode check (`tsc --noEmit`) passes with 0 errors.
  - Zero linter warnings (`eslint`).
  - Unit/Integration test suites pass (`vitest` / `npm test`) with exit code 0.
  - E2E Playwright tests prove real behavioral and data pipeline execution (no weak visibility-only checks; `readyState >= 2`, `currentTime` advance, real signed playback, collision-safe layout).
  - RLS enabled on all public schema tables with restrictive policies.
  - Zero mock-only production shims or fake success UI.

### 3.2 Minimal-Diff & Blast-Radius-Containment Rule
- **Constraint**: All edits must be minimal, surgical, atomic, and strictly contained to the target file(s) and module(s) in scope.
- **Forbidden**:
  - Unrelated refactoring, reformatting, or cosmetic changes across untouched code.
  - Adding unapproved third-party dependencies, vendors, or services.
  - Editing ghost/non-rendered paths (e.g. `src/components/dashboard/` instead of canonical `apps/omnihub-site/dashboard/`).
  - Breaking public API signatures or component props without explicit requirements.

---

## 4. Task Lifecycle & Verification Templates

### 4.2 Canonical ICC Task Template (Phase 2 — Task Execution)
Use this template for defining and running every task:

```markdown
INSTRUCTIONS:
[Exact task. One sentence. State the specific file(s)/module(s) in scope.]

CONTEXT:
- Role: You are operating inside APEX-OmniHub (v1.8.1, ARMAGEDDON L8).
- Reference: apex-standards skill (see attached/linked).
- Current state: [paste relevant file paths / current behavior]
- Objective: [business/technical outcome]

CONSTRAINTS:
- Minimal, surgical diff only. No unrelated refactors.
- No new dependencies, vendors, or cost without explicit approval.
- Must pass ARMAGEDDON L8 gate + apex-qa before merge.
- Before writing code: ask clarifying questions if scope is ambiguous.
- State confidence level and list anything assumed vs. verified in your output.
```

### 4.3 Pre-Merge Verification Checklist (Phase 3 — PR Gate)
Attach this checklist to every PR and handover artifact generated from Antigravity:

```markdown
### Pre-Merge Verification Checklist
- [ ] Confidence level stated? (Y/N)
- [ ] Assumptions explicitly listed and separated from verified facts? (Y/N)
- [ ] Cross-model adversarial review completed (Claude Code or Codex)? (Y/N)
- [ ] apex-qa / apex-riddler pass? (Y/N)
- [ ] ARMAGEDDON re-certification run? (Y/N)

> **GATING RULE:** No merge if any answer is "N".
```

### 4.4 Subagent Pilot Task (Phase 4 — Parallel Delegation)
When orchestrating subagents in Antigravity:
1. Select one bounded, non-core module.
2. Issue via the Canonical ICC template above, explicitly instructing:
   > *"Use dynamic subagents to parallelize [test writing / linting / doc generation] only — core logic changes remain single-threaded and reviewed serially."*
3. Run Section 4.3 checklist before accepting the result and consolidating artifacts.
