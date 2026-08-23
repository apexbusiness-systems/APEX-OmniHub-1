# A.R.I.S.E. Structural Baseline: 2026-08-23

Phase 0 (Structural Observatory). Measurement only. No code changes proposed.

## Composite Score: 0.39

| Signal | Score | Raw Finding |
|---|---|---|
| Acyclicity | 0.33 | 2 circular dependency chain(s) found |
| Modularity | 1.00 | no rule violations found |
| Redundancy | 0.98 | 152 duplicate block(s) found, 2.33% of scanned lines duplicated (2050 lines) |
| Depth | 0.25 | max nesting depth 10 in src/components/VoiceInterface.tsx; 3 file(s) exceed depth 4 |
| Equality | 0.11 | largest file apps/omnihub-site/src/pages/Home.tsx (2464 LOC); 8 file(s) exceed 600 LOC across 497 files (avg 141 LOC) |

## Scan Scope

- `src`
- `apps/omnihub-proof/src`
- `apps/omnihub-site/src`
- `packages/apex-sales/src`
- `packages/core/src`
- `packages/infrastructure/src`

## Methodology Note

- **Acyclicity**: score = 1 / (1 + cycleCount), from `madge --circular --json` across scan targets.
- **Modularity**: score = 1 / (1 + violationCount), from dependency-cruiser error-severity violations against config/.dependency-cruiser.cjs.
- **Redundancy**: score = clamp(1 - duplicatedLinePercentage / 100, 0, 1), from jscpd totals against config/.jscpd.json (minTokens: 50, minLines: 5).
- **Depth**: score = 1 / (1 + filesOverThreshold); a file counts if its deepest control-flow nesting (if/for/while/switch/try/catch) exceeds 4, computed via ts-morph AST traversal.
- **Equality**: score = 1 / (1 + filesOverThreshold); a file counts as a monolithic outlier if its LOC exceeds 600 (matching this repo's own CLAUDE.md modularity convention), computed via ts-morph.

## Next Action

This is a measurement snapshot. No autonomous action is taken on these findings in Phase 0.
