> **Historical Note:** This document contains legacy certification terminology. It has been superseded by the manual owner-approval process. CI now produces factual validation summaries only. CI validates. Owner certifies.

# APEX-OmniHub Claim-Approved Production Release Evidence

## Decision
READY_FOR_OWNER_RELEASE_APPROVAL

All technical truth-gating and capability build-up that can be completed and
verified in this environment is done. The public Tech Specs page renders ONLY
certified-functioning claims from a single source of truth. Production deploy,
merge, and the remaining owner-validation items are owner-controlled.

## Release Candidate
- Branch: `claude/modest-maxwell-oqflsj`
- Commits: `faa4b08f` (ledger + OmniSentry), `61b859b7` (OmniTrace), `7cc6affc` (Eyes/Identity foundation), `605cc98` (WebAuthn ES256 signature verification + Eyes endpoint), `2031ce6` (release evidence)
- PR: #1456
- Production URL: https://apexomnihub.icu/tech-specs (after owner deploy)
- Evidence generated at: 2026-06-21

## Single Source of Truth
- `apps/omnihub-site/src/content/featureTruth.ts` — every public claim, once, with an evidence-backed status.
- `apps/omnihub-site/src/content/site.ts` — `techSpecsConfig.sections` is projected from the ledger (CERTIFIED only); no hardcoded claim list.
- Gate tests: `tests/release/claim-truth.spec.ts` (+ per-capability surface tests). Full `tests/release/` suite: **52 passing**.

## Capabilities Built Up This Session (per "build up, do not downgrade")
| # | Capability | Outcome | Surface | Evidence |
|---|---|---|---|---|
| 1 | OmniSentry self-healing monitor | CERTIFIED | `/omni-sentry` live panel drives real `getHealthStatus()`; activated at startup | `OmniSentryPanel.tsx`, `pages/OmniSentry.tsx`, `src/main.tsx`, `omni-sentry-surface.spec.ts` |
| 2 | OmniTrace decision replay | CERTIFIED (code-certified; DB apply = owner action) | `/omni-trace` replays real RLS-scoped `audit_logs` | `OmniTracePanel.tsx`, `lib/omniTrace.ts`, `20260621000002_omnitrace_audit_read_contract.sql`, `omni-trace-surface.spec.ts` |
| 3 | Eyes multimodal vision | FOUNDATION (owner E2E validation) | built, not routed/visible | `lib/eyes-vision.ts`, `byom/EyesVisionInput.tsx`, `byom-proxy` multimodal, `eyes-vision-surface.spec.ts` |
| 4 | Identity WebAuthn | REQUIRES_OWNER_VALIDATION (crypto path complete; real-device + deploy = owner) | PasskeySection exposed at `/login`; ES256 signature verification implemented and tested | `identity-webauthn/webauthn-core.ts` (COSE + ECDSA + sign-counter), `identity-webauthn/index.ts`, `webauthnClient.ts`, `identity-webauthn-surface.spec.ts` |

## Claim Certification Matrix (by category)
CERTIFIED_FUNCTIONING (visible on Tech Specs):
- Brain: Saga compensation/rollback; FastAPI/Python runtime; pgvector RAG.
- Identity: Zero-Trust Device Registry.
- Conscience: Tri-Force (Guardian→Planner→Executor); MAN Mode gates; Human-oversight policy; Canonical semantic event normalization.
- Memory: Structured audit logging; OmniTrace decision replay.
- Immune: OmniSentry self-healing monitor (live); Gitleaks + TruffleHog (CI); OMEGA hardening.

FOUNDATION / REQUIRES_OWNER_VALIDATION (not visible on Tech Specs):
- Brain: Temporal engine (SDK present, worker reachability unproven).
- Senses: Ears (voice ingress), Touch (Capacitor), Capacitor native, Eyes (built; live-model validation pending).
- Identity: enclave signing, FaceID/TouchID (real device), no-biometric-egress, hardware receipts, WebAuthn (software path complete; real-device + deployment = owner).
- Memory: 365-day retention (actual policy unverified), DPIA/FRIA docs.

HIDDEN_FOR_RELEASE (unsupported as worded — removed from production):
- Brain: Workflow viz `:8080`. Senses: Whisper offline. Conscience: OmniLink port `9876`.
- Memory: Full reconstruction of any agent chain (no correlation id persisted to `audit_logs.metadata` today).
- Immune: Armageddon "40,000 iterations" and "0% escape rate".

## WebAuthn Engineering Gap — Closed
The ES256 assertion signature verification gap is closed:
- `verifyAssertionSignature` implemented in `webauthn-core.ts` — ECDSA/P-256/SHA-256 via `crypto.subtle`.
- Verifies `authenticatorData ‖ SHA-256(clientDataJSON)` against the stored raw P-256 public key.
- Accepts DER-encoded (real authenticator) and raw 64-byte r‖s signatures.
- Sign-counter monotonicity rejects replay and cloned credentials.
- Challenge is single-use, time-bound (5 min), consumed on failure.
- `extractCredentialPublicKey` parses CBOR attestationObject, extracts COSE ES256 P-256 key, stores as raw 65-byte point.
- Real crypto round-trip test in `identity-webauthn-surface.spec.ts` generates a P-256 key pair, signs, verifies, and confirms tampered/mismatched inputs fail.
- PasskeySection is exposed at `/login`. **Certification status: REQUIRES_OWNER_VALIDATION** — real-device FaceID/TouchID validation and edge function deployment remain owner-controlled.

## OmniTrace Data Layer — Guaranteed
- Migration `20260621000002_omnitrace_audit_read_contract.sql` is idempotent:
  - `CREATE TABLE IF NOT EXISTS audit_logs` with all required columns.
  - `ADD COLUMN IF NOT EXISTS` for `resource_type`, `resource_id`, `metadata`, `created_at`.
  - `ENABLE ROW LEVEL SECURITY` (no-op if already enabled).
  - `DROP POLICY IF EXISTS` / `CREATE POLICY "Users can view own audit logs" USING (actor_id = auth.uid())`.
  - `CREATE INDEX IF NOT EXISTS` for `actor_id`, `created_at DESC`, `(resource_type, resource_id)`.
- OmniTracePanel queries only `id, actor_id, action_type, resource_type, resource_id, metadata, created_at`.
- Grouping falls back honestly to chronological timeline when no correlation id exists in metadata.
- **Certification status: CERTIFIED_FUNCTIONING** (code-certified). Production DB apply is owner-controlled.

## CI / Release Gates
| Gate | Result |
|---|---|
| Release tests (`tests/release/`) | **52 passed** |
| Production build (`npm run build`) | green |
| TypeScript typecheck | clean |
| ESLint | clean |
| Claim-truth gate | passing (no unsupported literal in shipped site content) |
| Ops Doc Guard | satisfied (§2 + §4 + §9.7 updated in `APEX_AGENT_OPERATIONS.md`) |
| RFC marker | satisfied (`memory/omni-recall/rfc/RFC_2026_06_21_WEBAUTHN_OMNITRACE_READ_CONTRACT.md` committed) |

## Security / Privacy
- No insecure auth surface ships: WebAuthn uses real ES256 signature verification; private keys and biometrics never leave the authenticator.
- No image bytes logged (Eyes); no biometric data or private keys stored anywhere server-side (WebAuthn stores only public-key metadata).
- `audit_logs` RLS scopes reads to `actor_id = auth.uid()` — users cannot read each other's audit events.
- No secrets in code; edge functions inert until owner deploys.

## Honesty Constraints
- OmniTrace: `CERTIFIED_FUNCTIONING` — code path is complete and tested. Does NOT claim full agent-chain reconstruction. Correlation-id grouping only fires when a correlation id actually exists in `audit_logs.metadata` (current writers do not emit one, so the UI honestly falls back to chronological timeline).
- WebAuthn: `REQUIRES_OWNER_VALIDATION` — cryptographic software path is implemented and unit-tested. Not certified until owner deploys to Supabase and validates on a real device.
- Eyes: `REQUIRES_OWNER_VALIDATION` — foundation only. Not certified until owner runs live BYOM/Anthropic vision test.

## Rollback / Disable Path
- Feature flags: certified surfaces are additive routes; remove route entries in `App.tsx` to disable.
- PR revert: per-capability commits revert cleanly.
- Cloudflare: site is static; redeploy previous build to roll back.
- DB: no migrations applied to production by this PR.

## Owner Actions Remaining
1. Review + merge branch `claude/modest-maxwell-oqflsj` (PR #1456); deploy site (Cloudflare).
2. Apply migration: `supabase db push --include-all` against production project. _(Historical instruction from the PR #1456 release. Superseded by the 2026-09-29 owner rules: do not use `--include-all`; the owner applies only migrations that are on `main`, manually and in order.)_
3. Deploy edge function: `supabase functions deploy identity-webauthn --project-ref rtopreovkywofgwgmozi`.
4. Validate WebAuthn on a real device (FaceID/TouchID); certify `identity.webauthn` and `identity.faceid` if green.
5. Eyes: run client→`byom-proxy`→vision E2E with a live BYOM key; certify `senses.eyes` if green.
6. Optional: persist a correlation id into `audit_logs.metadata` from event writers to unlock `memory.fullChain`.

## Final Recommendation
Ship the certified, truthful build. The public Tech Specs page is claim-accurate. WebAuthn now has a complete, tested software path — the only remaining gap is real-device validation, which is owner-controlled by design.
