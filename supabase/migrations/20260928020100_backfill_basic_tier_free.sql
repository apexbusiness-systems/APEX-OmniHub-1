-- ============================================================================
-- MIGRATION: Backfill BASIC activations from 'starter' to 'free' (WP-01, owner-gated N5)
-- ============================================================================
-- OWNER APPROVAL REQUIRED BEFORE MERGE (contract N5). Pre-merge count query:
--   SELECT count(*) FROM public.subscriptions WHERE tier='starter' AND stripe_subscription_id IS NULL;
-- Production result on 2026-09-28: 0 rows (8 free, 1 pro), so this is currently a no-op.
-- Idempotent: a re-run matches 0 rows.
-- ============================================================================
UPDATE public.subscriptions SET tier = 'free'
WHERE tier = 'starter' AND stripe_subscription_id IS NULL;
