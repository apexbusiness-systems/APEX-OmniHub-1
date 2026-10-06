/**
 * Pure Stripe → subscriptions mapping for lifecycle sync (APEX-REV-2026-09 WP-02, F-03).
 * Zero imports so both Deno and Vitest can load it. Tier ladder per RFC-003 / A1:
 * free < starter < pro < business ($299 CAD) < enterprise.
 */
export type DbSubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired' | 'paused';
export type DbSubscriptionTier = 'free' | 'starter' | 'pro' | 'business' | 'enterprise';

const STATUS_MAP: Readonly<Record<string, DbSubscriptionStatus>> = {
  active: 'active',
  trialing: 'trialing',
  past_due: 'past_due',
  unpaid: 'past_due',
  incomplete: 'past_due',
  incomplete_expired: 'expired',
  canceled: 'canceled',
  paused: 'paused',
};

export function mapStripeStatus(stripeStatus: string): DbSubscriptionStatus | null {
  return STATUS_MAP[stripeStatus] ?? null;
}

export function tierForPrice(
  priceId: string | undefined,
  prices: { pro?: string; bus?: string }
): DbSubscriptionTier | null {
  if (!priceId) return null;
  if (prices.bus && priceId === prices.bus) return 'business';
  if (prices.pro && priceId === prices.pro) return 'pro';
  return null; // unknown price: never downgrade, leave tier unchanged
}

export const LIFECYCLE_EVENTS: ReadonlySet<string> = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
]);

/** Subscription id for a lifecycle event object, or null when there is none. */
export function subscriptionIdFor(eventType: string, object: { id?: unknown; subscription?: unknown }): string | null {
  const raw = eventType.startsWith('customer.subscription.')
    ? object.id
    : object.subscription && typeof object.subscription === 'object'
      ? (object.subscription as { id?: unknown }).id
      : object.subscription;
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}

/**
 * user_entitlements.tier (skill caps) for a synced subscription (WP-03, L8/F-24).
 * Paid access continues through dunning (past_due); canceled/expired/paused drop to
 * BASIC. Returns null when the tier cannot be classified (leave the row unchanged).
 */
export function entitlementTierFor(
  tier: string | null | undefined,
  status: DbSubscriptionStatus
): 'BASIC' | 'PRO' | 'BUS' | null {
  if (status === 'canceled' || status === 'expired' || status === 'paused') return 'BASIC';
  switch (tier) {
    case 'business':
    case 'enterprise':
      return 'BUS';
    case 'pro':
      return 'PRO';
    case 'free':
    case 'starter':
      return 'BASIC';
    default:
      return null;
  }
}
