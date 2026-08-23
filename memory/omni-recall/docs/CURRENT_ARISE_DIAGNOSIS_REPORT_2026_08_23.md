# A.R.I.S.E. Diagnosis Report: 2026-08-23

Phase 1a (Diagnosis Engine). Read-only analysis. No code changes proposed.

## Composite Score: 0.39
Phase 0 baseline: 0.37 | Gap from perfect: 0.61

## Signal Ranking (worst first)

### Rank 1 — Equality: 0.11 (gap: 0.89) — HOTSPOT
**Raw finding:** largest file apps/omnihub-site/src/pages/Home.tsx (2464 LOC); 8 file(s) exceed 600 LOC across 497 files (avg 141 LOC)
**Named artifact:** `apps/omnihub-site/src/pages/Home.tsx` — 2464 LOC (avg 141)
**Structural risk:** Oversized files concentrate unrelated responsibilities, which raises merge-conflict surface and makes change impact hard to reason about.

### Rank 2 — Depth: 0.25 (gap: 0.75) — HOTSPOT
**Raw finding:** max nesting depth 10 in src/components/VoiceInterface.tsx; 3 file(s) exceed depth 4
**Named artifact:** `src/components/VoiceInterface.tsx` — nesting depth 10
**Structural risk:** Deeply nested control flow raises cyclomatic complexity, making edge cases and race conditions easier to miss during review.

### Rank 3 — Acyclicity: 0.33 (gap: 0.67) — HOTSPOT
**Raw finding:** 2 circular dependency chain(s) found
**Named artifact:** N/A — signal is repo-wide (2 circular dependency chain(s) found)
**Structural risk:** Circular dependency chains create tight coupling that risks load-order bugs and makes isolated testing or safe refactors difficult.

### Rank 4 — Redundancy: 0.98 (gap: 0.02)
**Raw finding:** 152 duplicate block(s) found, 2.33% of scanned lines duplicated (2050 lines)
**Named artifact:** N/A — signal is repo-wide (152 duplicate block(s) found, 2.33% of scanned lines duplicated (2050 lines))
**Structural risk:** Duplicated logic drifts out of sync across copies, so bug fixes applied to one copy silently fail to reach the others.

### Rank 5 — Modularity: 1.00 (gap: 0.00)
**Raw finding:** no rule violations found
**Named artifact:** N/A — signal is repo-wide (no rule violations found)
**Structural risk:** Dependency-cruiser rule violations signal that architectural boundaries are not being enforced, risking uncontrolled coupling growth.

## Priority Targets for Phase 1b

| Priority | File | Signal | Metric |
|---|---|---|---|
| 1 | apps/omnihub-site/src/pages/Home.tsx | Equality | 2464 LOC (avg 141) |
| 2 | src/components/VoiceInterface.tsx | Depth | nesting depth 10 |

## Methodology

- **Acyclicity**: score = 1 / (1 + cycleCount), from `madge --circular --json` across scan targets.
- **Modularity**: score = 1 / (1 + violationCount), from dependency-cruiser error-severity violations against config/.dependency-cruiser.cjs.
- **Redundancy**: score = clamp(1 - duplicatedLinePercentage / 100, 0, 1), from jscpd totals against config/.jscpd.json (minTokens: 50, minLines: 5).
- **Depth**: score = 1 / (1 + filesOverThreshold); a file counts if its deepest control-flow nesting (if/for/while/switch/try/catch) exceeds 4, computed via ts-morph AST traversal.
- **Equality**: score = 1 / (1 + filesOverThreshold); a file counts as a monolithic outlier if its LOC exceeds 600 (matching this repo's own CLAUDE.md modularity convention), computed via ts-morph.

## Next Action

Phase 1a is diagnosis only. No autonomous action taken.
Findings are inputs for Phase 1b scoping.
Phase 1b requires a separate, explicitly-scoped contract.
