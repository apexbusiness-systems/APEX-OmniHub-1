import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  LIFECYCLE_EVENTS,
  mapStripeStatus,
  subscriptionIdFor,
  tierForPrice,
} from '../../supabase/functions/_shared/stripeSubscriptionSync';

// APEX-REV-2026-09 WP-02 (F-03, F-04, F-17).
describe('mapStripeStatus', () => {
  it.each([
    ['active', 'active'],
    ['trialing', 'trialing'],
    ['past_due', 'past_due'],
    ['unpaid', 'past_due'],
    ['incomplete', 'past_due'],
    ['incomplete_expired', 'expired'],
    ['canceled', 'canceled'],
    ['paused', 'paused'],
  ])('%s → %s', (stripe, db) => expect(mapStripeStatus(stripe)).toBe(db));

  it('returns null for unknown statuses', () => expect(mapStripeStatus('mystery')).toBeNull());
});

describe('tierForPrice', () => {
  const prices = { pro: 'price_pro', bus: 'price_bus' };
  it('maps the bus price to business and the pro price to pro', () => {
    expect(tierForPrice('price_bus', prices)).toBe('business');
    expect(tierForPrice('price_pro', prices)).toBe('pro');
  });
  it('never guesses for unknown or missing prices', () => {
    expect(tierForPrice('price_other', prices)).toBeNull();
    expect(tierForPrice(undefined, prices)).toBeNull();
    expect(tierForPrice('price_bus', {})).toBeNull();
  });
});

describe('lifecycle routing', () => {
  it('covers exactly the subscribed lifecycle events', () => {
    expect([...LIFECYCLE_EVENTS].sort()).toEqual([
      'customer.subscription.created',
      'customer.subscription.deleted',
      'customer.subscription.updated',
      'invoice.paid',
      'invoice.payment_failed',
    ]);
    expect(LIFECYCLE_EVENTS.has('checkout.session.completed')).toBe(false);
  });

  it('resolves the subscription id per event family', () => {
    expect(subscriptionIdFor('customer.subscription.updated', { id: 'sub_1' })).toBe('sub_1');
    expect(subscriptionIdFor('invoice.paid', { id: 'in_1', subscription: 'sub_2' })).toBe('sub_2');
    expect(subscriptionIdFor('invoice.paid', { subscription: { id: 'sub_3' } })).toBe('sub_3');
    expect(subscriptionIdFor('invoice.payment_failed', { subscription: null })).toBeNull();
  });
});

describe('stripe-webhook hardening (static)', () => {
  const src = readFileSync(resolve(process.cwd(), 'supabase/functions/stripe-webhook/index.ts'), 'utf8');
  it('verifies signatures with constructEventAsync + SubtleCrypto (F-04)', () => {
    expect(src).toContain('Stripe.createSubtleCryptoProvider()');
    expect(src).toMatch(/constructEventAsync\(body, signature, stripeWebhookSecret, undefined, cryptoProvider\)/);
    expect(src).not.toMatch(/webhooks\.constructEvent\(/);
  });
  it('fails closed when secrets are unset and rate-limits by IP (F-17)', () => {
    expect(src).toMatch(/if \(!stripeSecretKey \|\| !stripeWebhookSecret\)/);
    expect(src).toContain("req.headers.get('cf-connecting-ip')");
    expect(src).not.toMatch(/checkRateLimit\(signature/);
  });
});
