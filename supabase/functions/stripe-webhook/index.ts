import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.18.0?target=deno";
import {
  checkRateLimit,
  rateLimitExceededResponse,
  RATE_LIMIT_CONFIGS,
} from "../_shared/rate-limit.ts";
import {
  entitlementTierFor,
  LIFECYCLE_EVENTS,
  mapStripeStatus,
  subscriptionIdFor,
  tierForPrice,
} from "../_shared/stripeSubscriptionSync.ts";

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

const stripe = new Stripe(stripeSecretKey ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Deno has no sync HMAC; Stripe's documented Deno pattern is constructEventAsync + SubtleCrypto (F-04).
const cryptoProvider = Stripe.createSubtleCryptoProvider();

// Create a service role client to execute the RPC
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

type SubscriptionPeriod = {
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
};

function parseSkills(skillsStr: string | undefined): unknown[] {
  if (!skillsStr) {
    return [];
  }

  try {
    return JSON.parse(skillsStr);
  } catch (error) {
    console.error('Failed to parse skills from metadata', error);
    return [];
  }
}

async function getSubscriptionPeriod(stripeSubscriptionId: string): Promise<SubscriptionPeriod> {
  try {
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    return {
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    };
  } catch (error) {
    console.error('Failed to retrieve subscription to get period dates', error);
    return {
      currentPeriodStart: null,
      currentPeriodEnd: null,
    };
  }
}

async function handleCheckoutSessionCompleted(event: Stripe.Event): Promise<Response | null> {
  const session = event.data.object as Stripe.Checkout.Session;

  const userId = session.metadata?.user_id;
  const tier = session.metadata?.tier;
  const skills = parseSkills(session.metadata?.skills);
  const stripeCustomerId = session.customer as string;
  const stripeSubscriptionId = session.subscription as string;

  if (!userId || !tier) {
    console.error('Missing userId or tier in session metadata');
    return new Response('Missing metadata', { status: 400 });
  }

  const { currentPeriodStart, currentPeriodEnd } = stripeSubscriptionId
    ? await getSubscriptionPeriod(stripeSubscriptionId)
    : { currentPeriodStart: null, currentPeriodEnd: null };

  const { data, error } = await supabaseAdmin.rpc('activate_client_subscription', {
    p_user_id: userId,
    p_tier: tier,
    p_skills: skills,
    p_stripe_customer_id: stripeCustomerId,
    p_stripe_subscription_id: stripeSubscriptionId,
    p_current_period_start: currentPeriodStart ? currentPeriodStart.toISOString() : null,
    p_current_period_end: currentPeriodEnd ? currentPeriodEnd.toISOString() : null
  });

  if (error) {
    console.error('Failed to update entitlement via RPC', error);
    return new Response('Failed to provision user', { status: 500 });
  }

  console.log('Successfully provisioned PRO user', userId, data);
  return null;
}

const RECEIVED = () =>
  new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

/**
 * Lifecycle sync (F-03): always re-reads the subscription from Stripe, so the
 * handler is order-independent and idempotent. Stripe/DB errors return 500 so
 * Stripe retries; a row that does not exist yet returns 200 (checkout creates it).
 */
async function syncSubscription(stripeSubscriptionId: string): Promise<Response> {
  let sub: Stripe.Subscription;
  try {
    sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  } catch (error) {
    console.error('Lifecycle sync: subscription retrieve failed', error);
    return new Response('Stripe retrieve failed', { status: 500 });
  }

  const status = mapStripeStatus(sub.status);
  if (!status) {
    console.warn('Lifecycle sync: unknown Stripe status, ignored', sub.status);
    return RECEIVED();
  }
  const tier = tierForPrice(sub.items?.data?.[0]?.price?.id, {
    pro: Deno.env.get('STRIPE_PRICE_ID_PRO'),
    bus: Deno.env.get('STRIPE_PRICE_ID_BUS'),
  });

  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      ...(tier ? { tier } : {}),
    })
    .eq('stripe_subscription_id', sub.id)
    .select('user_id, tier');
  if (error) {
    console.error('Lifecycle sync: subscriptions update failed', error);
    return new Response('Failed to sync subscription', { status: 500 });
  }
  if (!data || data.length === 0) {
    console.warn('Lifecycle sync: no subscriptions row yet for', sub.id);
    return RECEIVED();
  }

  // Keep skill caps (user_entitlements.tier) in step with paid state (WP-03, L8).
  const entTier = entitlementTierFor(data[0].tier, status);
  if (entTier) {
    const { error: entError } = await supabaseAdmin
      .from('user_entitlements')
      .update({ tier: entTier, updated_at: new Date().toISOString() })
      .eq('user_id', data[0].user_id);
    if (entError) {
      console.error('Lifecycle sync: user_entitlements update failed', entError);
      return new Response('Failed to sync entitlements', { status: 500 });
    }
  }
  return RECEIVED();
}

async function processStripeEvent(event: Stripe.Event): Promise<Response> {
  if (LIFECYCLE_EVENTS.has(event.type)) {
    const id = subscriptionIdFor(event.type, event.data.object as { id?: unknown; subscription?: unknown });
    return id ? await syncSubscription(id) : RECEIVED();
  }
  if (event.type !== 'checkout.session.completed') {
    return RECEIVED();
  }

  const errorResponse = await handleCheckoutSessionCompleted(event);
  if (errorResponse) {
    return errorResponse;
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  // Fail closed: an unset secret must never verify or process events.
  if (!stripeSecretKey || !stripeWebhookSecret) {
    return new Response('Webhook not configured', { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing Stripe signature', { status: 400 });
  }

  // Distributed rate limiting — keyed by caller IP (F-17: the signature is unique per delivery)
  const clientIp =
    req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await checkRateLimit(clientIp, RATE_LIMIT_CONFIGS.stripeWebhook);
  if (!rl.allowed) {
    return rateLimitExceededResponse(null, rl);
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    // Verify signature
    event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret, undefined, cryptoProvider);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return new Response('Webhook signature verification failed.', { status: 400 });
  }

  try {
    return await processStripeEvent(event);
  } catch (error) {
    console.error('Error processing webhook', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});
