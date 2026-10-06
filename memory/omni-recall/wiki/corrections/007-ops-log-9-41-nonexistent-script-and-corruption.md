---
version: 1.0.0
last_audited: 2026-09-29
status: verified
---

# Correction 007: Ops-log §9.41 named a script and files that do not exist; text corruption in the ops log; harness doc contradicted the matrix

Date: 2026-09-29
Scope: `docs/APEX_AGENT_OPERATIONS.md` (§9.41 and file-wide encoding), `docs/release/production-validation-harness.md` (line 7), `.understand-anything/CANONICAL_STATE_2026-08-23.md`

## What was wrong

1. **§9.41 (2026-09-05) named artifacts that never existed.** It said PR #13 added `npm run release:validation-matrix:check` running `scripts/release/check-release-matrix.mjs`, and listed `omniMediaUploadCatalog.ts` as changed. `git log --all` shows no such script in any commit, and no trace of that file (`git log --all -S`); the real command is `npm run release:validation-matrix` (`scripts/ci/verify-release-validation-matrix.mjs`). It also called the production suite "read-only" although the persistence proof writes and reads back one probe row, and it cited an evidence directory (`artifacts/production-validation/2026-09-05T03-33-13/`) that is not committed.
2. **`docs/release/production-validation-harness.md` said "GO for claiming fully certified production functionality" and that Request Access persistence was verified.** The matrix it defers to has `REQUEST_ACCESS_PROOF: HONESTLY_GATED` (`backendPersistenceProven: false`), and the ops log (§9.50) shows production builds compiled the lead insert out until 2026-09-28.
3. **Text corruption.** `docs/APEX_AGENT_OPERATIONS.md` had 228 lines of double-encoded UTF-8 (for example the right-arrow character stored as three Latin-1 characters) plus seven control characters where letters were lost (`apex-agent` → bell + `pex-agent`, `bun` → backspace + `un`). `.understand-anything/CANONICAL_STATE_2026-08-23.md` had the same class of loss (`v1.8.3`, `apps/`, `type=`, commit `be00488d`) and duplicated table rows. The pattern (a backslash escape such as `\a`, `\b`, `\v`, `\t` swallowing the next letter, and cp1252/UTF-8 double encoding) is consistent with text written through a Windows shell or an unescaped string literal; the exact writer was not determined.

## Root cause

- The claim-integrity gate (`scripts/ci/check-ops-doc-claim-integrity.mjs`) cross-checks only sections that cite an inline commit SHA next to a changed-files line (see correction 006). §9.41 cites a PR number, so its file list was never checked. Nothing checks that a script name written in the ops log exists in `package.json`.
- No check scans documents for control characters or mojibake.
- The harness doc's sentence was written before, or without reading, the matrix item that gates Request Access.

## Corrected state

- §9.41 carries a dated correction bullet; the harness doc's status sentence now matches the matrix (19 of 20 `VERIFIED`, Request Access `HONESTLY_GATED`); the corrupted files are repaired (0 control characters, 0 mojibake lines; verified by scan).
- Historical records were repaired in place only where characters were lost; no fact in them was changed.

## Promotion decision

Page only. Proposed (not implemented, owner to schedule): extend `docs:check` to fail on control characters and mojibake in tracked Markdown, and extend the claim-integrity gate to verify that `npm run <script>` names cited in `docs/APEX_AGENT_OPERATIONS.md` exist in `package.json`.
