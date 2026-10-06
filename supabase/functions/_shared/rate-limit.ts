/**
 * Distributed Rate Limiting for Supabase Edge Functions
 *
 * Uses Upstash Redis REST API for persistent rate limiting across serverless instances.
 * Fails closed by default. Operators may explicitly fail open only when Upstash is
 * entirely unconfigured (both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * absent) AND RATE_LIMIT_FAIL_OPEN_UNCONFIGURED=true. Partial Upstash configuration
 * (one var present, one absent) always fails closed — that is a misconfiguration, not
 * an intentional "not provisioned" state. The opt-in may be scoped to specific key
 * prefixes via RATE_LIMIT_FAIL_OPEN_UNCONFIGURED_PREFIXES (comma-separated list).
 *
 * Author: OmniLink APEX
 * Date: 2026-01-21
 * Remediation: R3 - In-memory rate limiting replaced with distributed Upstash REST
 */

import { Redis } from "https://esm.sh/@upstash/redis@1.35.3";
import { Ratelimit } from "https://esm.sh/@upstash/ratelimit@2.0.8";
import { buildCorsHeaders } from "./cors.ts";

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Unique identifier prefix for this rate limit type */
  keyPrefix: string;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Maximum number of requests allowed */
  limit: number;
  /** Number of remaining requests in current window */
  remaining: number;
  /** Unix timestamp (ms) when the rate limit resets */
  reset: number;
  /** Milliseconds until rate limit resets */
  resetIn: number;
  /** Headers to include in response */
  headers: Headers;
}

/**
 * Pre-configured rate limit profiles for different use cases
 */
export const RATE_LIMIT_CONFIGS = {
  web3Nonce: { maxRequests: 10, windowMs: 60000, keyPrefix: "web3-nonce" },
  verifyNft: { maxRequests: 5, windowMs: 60000, keyPrefix: "verify-nft" },
  web3Verify: { maxRequests: 10, windowMs: 3600000, keyPrefix: "web3-verify" }, // 10/hour
  alchemyWebhook: { maxRequests: 60, windowMs: 60000, keyPrefix: "alchemy" },
  healthcheck: { maxRequests: 30, windowMs: 60000, keyPrefix: "health" },
  storageUploadUrl: { maxRequests: 20, windowMs: 60000, keyPrefix: "upload" },
  automationExecute: {
    maxRequests: 100,
    windowMs: 60000,
    keyPrefix: "automation",
  },
  publicOnboardingGenerate: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
    keyPrefix: "public-onboarding-generate",
  },
  activateClient: { maxRequests: 5, windowMs: 3600000, keyPrefix: "activate-client" },
  apexAgent: { maxRequests: 30, windowMs: 60000, keyPrefix: "apex-agent" },
  apexVoice: { maxRequests: 30, windowMs: 60000, keyPrefix: "apex-voice" },
  createCheckout: { maxRequests: 5, windowMs: 60000, keyPrefix: "create-checkout" },
  executeAutomation: { maxRequests: 60, windowMs: 60000, keyPrefix: "execute-automation" },
  executeWorkflow: { maxRequests: 20, windowMs: 60000, keyPrefix: "execute-workflow" },
  omniRuns: { maxRequests: 30, windowMs: 60000, keyPrefix: "omni-runs" },
  omnibridgeControl: { maxRequests: 20, windowMs: 60000, keyPrefix: "omnibridge-control" },
  omnilinkEval: { maxRequests: 10, windowMs: 60000, keyPrefix: "omnilink-eval" },
  omnilinkRetryScheduler: { maxRequests: 5, windowMs: 60000, keyPrefix: "omnilink-retry" },
  opsVoiceHealth: { maxRequests: 30, windowMs: 60000, keyPrefix: "ops-health" },
  physiomniAction: { maxRequests: 20, windowMs: 60000, keyPrefix: "physiomni-action" },
  physiomniIngest: { maxRequests: 120, windowMs: 60000, keyPrefix: "physiomni-ingest" },
  sendPushNotification: { maxRequests: 10, windowMs: 60000, keyPrefix: "send-push" },
  stripeWebhook: { maxRequests: 120, windowMs: 60000, keyPrefix: "stripe-webhook" },
  triggerWorkflow: { maxRequests: 20, windowMs: 60000, keyPrefix: "trigger-workflow" },
  byomProxy: { maxRequests: 60, windowMs: 60000, keyPrefix: "byom-proxy" },
  omnilinkPort: { maxRequests: 30, windowMs: 60000, keyPrefix: "omnilink-port" },
  mcpGateway: { maxRequests: 60, windowMs: 60000, keyPrefix: "mcp-gateway" },
} as const;

// Cache Upstash client and ratelimiter instances at module scope
let redisClient: Redis | null = null;
const ratelimiters = new Map<string, Ratelimit>();

/**
 * Initialize or get cached Redis client
 * Returns null if environment variables are not configured (fail-closed mode)
 */
function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const url = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const token = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

  if (!url || !token) {
    return null;
  }

  try {
    redisClient = new Redis({ url, token });
    return redisClient;
  } catch (error) {
    console.error("Failed to initialize Upstash Redis client:", error);
    return null;
  }
}

type UpstashConfigState = "absent" | "partial" | "configured";

/**
 * Classifies the Upstash credential state into three cases so the rate limiter
 * can distinguish "never provisioned" from "misconfigured" — only the former
 * may fail open under an explicit operator opt-in.
 */
function getUpstashConfigState(): UpstashConfigState {
  const hasUrl = Boolean(Deno.env.get("UPSTASH_REDIS_REST_URL"));
  const hasToken = Boolean(Deno.env.get("UPSTASH_REDIS_REST_TOKEN"));

  if (!hasUrl && !hasToken) return "absent";
  if (hasUrl && hasToken) return "configured";
  return "partial";
}

/**
 * Get or create a Ratelimit instance for the given config
 */
function getRatelimiter(config: RateLimitConfig): Ratelimit | null {
  const cacheKey = `${config.keyPrefix}:${config.maxRequests}:${config.windowMs}`;

  if (ratelimiters.has(cacheKey)) {
    return ratelimiters.get(cacheKey)!;
  }

  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        config.maxRequests,
        `${config.windowMs} ms`
      ),
      prefix: config.keyPrefix,
    });

    ratelimiters.set(cacheKey, limiter);
    return limiter;
  } catch (error) {
    console.error("Failed to create Ratelimit instance:", error);
    return null;
  }
}

/**
 * Normalize identifier for rate limiting
 * @param identifier - Raw identifier (e.g., IP address, user ID)
 * @returns Normalized, safe identifier
 */
function normalizeIdentifier(identifier: string): string {
  const trimmed = identifier?.trim();
  if (!trimmed) return "anonymous";
  return trimmed;
}

/**
 * Create rate limit headers
 */
function createRateLimitHeaders(result: {
  limit: number;
  remaining: number;
  reset: number;
}): Headers {
  const headers = new Headers();
  headers.set("X-RateLimit-Limit", result.limit.toString());
  headers.set(
    "X-RateLimit-Remaining",
    Math.max(0, result.remaining).toString()
  );
  headers.set("X-RateLimit-Reset", new Date(result.reset).toISOString());

  if (result.remaining <= 0) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
    headers.set("Retry-After", retryAfter.toString());
  }

  return headers;
}

/**
 * Check rate limit for a given identifier
 *
 * FAIL-CLOSED BEHAVIOR: If Upstash is not configured or errors occur,
 * this function returns allowed=false and logs the denied limiter state.
 *
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @param opts - Optional parameters including clientOverride for testing
 * @returns Rate limit result with allowed status and headers
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
  opts?: {
    clientOverride?: {
      limit: (key: string) => Promise<{
        success: boolean;
        limit: number;
        remaining: number;
        reset: number;
      }>;
    };
  }
): Promise<RateLimitResult> {
  const normalized = normalizeIdentifier(identifier);
  const key = `${config.keyPrefix}:${normalized}`;
  const now = Date.now();

  // Handle test override
  if (opts?.clientOverride) {
    try {
      const result = await opts.clientOverride.limit(key);
      return {
        allowed: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        resetIn: result.reset - now,
        headers: createRateLimitHeaders(result),
      };
    } catch (error) {
      console.error("Rate limit clientOverride error:", error);
      // FAIL-CLOSED: limiter runtime error must not fail open regardless of flag.
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: now + config.windowMs,
        resetIn: config.windowMs,
        headers: new Headers(),
      };
    }
  }

  // Get or create ratelimiter
  const limiter = getRatelimiter(config);

  if (!limiter) {
    const configState = getUpstashConfigState();

    // Partial config: one credential present, the other missing — misconfiguration,
    // not an intentional "never provisioned" state. Always fail closed.
    if (configState === "partial") {
      console.error(
        `Rate limiting fail-closed: partial Upstash configuration for ${config.keyPrefix}. ` +
          "Both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required."
      );
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: now + config.windowMs,
        resetIn: config.windowMs,
        headers: new Headers(),
      };
    }

    // Absent config: neither credential is present (backend never provisioned).
    // Operators may opt in to fail open via RATE_LIMIT_FAIL_OPEN_UNCONFIGURED=true,
    // optionally scoped to specific key prefixes via RATE_LIMIT_FAIL_OPEN_UNCONFIGURED_PREFIXES.
    if (
      configState === "absent" &&
      Deno.env.get("RATE_LIMIT_FAIL_OPEN_UNCONFIGURED") === "true"
    ) {
      const prefixesRaw = Deno.env.get("RATE_LIMIT_FAIL_OPEN_UNCONFIGURED_PREFIXES");
      if (prefixesRaw) {
        const allowedPrefixes = new Set(prefixesRaw.split(",").map((p) => p.trim()));
        if (!allowedPrefixes.has(config.keyPrefix)) {
          console.error(
            `Rate limiting fail-closed: Upstash absent for ${config.keyPrefix}. ` +
              "Not in RATE_LIMIT_FAIL_OPEN_UNCONFIGURED_PREFIXES allowlist."
          );
          return {
            allowed: false,
            limit: config.maxRequests,
            remaining: 0,
            reset: now + config.windowMs,
            resetIn: config.windowMs,
            headers: new Headers(),
          };
        }
      }

      console.warn(
        `Rate limiting DISABLED for ${config.keyPrefix}: Upstash not configured and ` +
          "RATE_LIMIT_FAIL_OPEN_UNCONFIGURED=true. Requests are NOT rate limited. " +
          "Provision UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to restore protection."
      );
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        reset: now + config.windowMs,
        resetIn: config.windowMs,
        headers: createRateLimitHeaders({
          limit: config.maxRequests,
          remaining: config.maxRequests,
          reset: now + config.windowMs,
        }),
      };
    }

    // FAIL-CLOSED: absent without opt-in flag, configured but init failed, or any other state.
    console.error(
      `Rate limiting fail-closed: Upstash not configured for ${config.keyPrefix}. ` +
        "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable distributed rate limiting."
    );

    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: now + config.windowMs,
      resetIn: config.windowMs,
      headers: new Headers(),
    };
  }

  try {
    // Call Upstash rate limiter
    const result = await limiter.limit(key);

    return {
      allowed: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      resetIn: result.reset - now,
      headers: createRateLimitHeaders(result),
    };
  } catch (error) {
    // FAIL-CLOSED: Upstash error (network, timeout, etc.)
    console.error(
      `Rate limiting fail-closed: Upstash error for ${config.keyPrefix}:`,
      error
    );

    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: now + config.windowMs,
      resetIn: config.windowMs,
      headers: new Headers(),
    };
  }
}

/**
 * Create a 429 response for rate limit exceeded
 * @param origin - Origin for CORS headers
 * @param result - Rate limit result
 * @returns 429 Response with appropriate headers
 */
export function rateLimitExceededResponse(
  origin: string | null,
  result: RateLimitResult
): Response {
  const retryAfter = Math.ceil(result.resetIn / 1000);
  const corsHeaders = buildCorsHeaders(origin);

  const headers = new Headers(corsHeaders);

  // Add rate limit headers
  result.headers.forEach((value, key) => {
    headers.set(key, value);
  });

  headers.set("Content-Type", "application/json");

  return new Response(
    JSON.stringify({
      error: "rate_limit_exceeded",
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      retry_after: retryAfter,
    }),
    {
      status: 429,
      headers,
    }
  );
}

/**
 * Add rate limit headers to an existing response
 * @param res - Original response
 * @param result - Rate limit result
 * @returns Cloned response with rate limit headers added
 */
export function addRateLimitHeaders(
  res: Response,
  result: RateLimitResult
): Response {
  const headers = new Headers(res.headers);

  result.headers.forEach((value, key) => {
    headers.set(key, value);
  });

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}
