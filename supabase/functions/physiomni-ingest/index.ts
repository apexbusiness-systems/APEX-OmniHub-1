import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { buildCorsHeaders, handlePreflight } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabaseClient.ts';
import {
  checkRateLimit,
  rateLimitExceededResponse,
  RATE_LIMIT_CONFIGS,
} from '../_shared/rate-limit.ts';
// In a real env, this would be a shared import.
import { z } from 'https://deno.land/x/zod@v3.21.4/mod.ts';

const MAX_BODY_BYTES = 4096;
const REPLAY_WINDOW_MS = 30_000;
/** Limit for callers that have not authenticated yet (keyed by client IP). */
const IP_RATE_LIMIT = { maxRequests: 600, windowMs: 60_000, keyPrefix: 'physiomni-ingest-ip' };

const PhysiOmniTelemetrySchema = z.object({
  device_id: z.string().min(1),
  tenant_id: z.string().min(1),
  timestamp: z.string().datetime(),
  nonce: z.string().min(16),
  signature: z.string().min(64),
  payload: z.object({
    vibration_x: z.number(),
    vibration_y: z.number(),
    vibration_z: z.number(),
    temp_c: z.number(),
  }),
});

function json(body: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function clientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip')?.trim() ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('Origin') ?? '');
  if (req.method === 'OPTIONS') {
    return handlePreflight(req);
  }

  try {
    const isLiveEnabled = Deno.env.get('PHYSIOMNI_LIVE_ENABLED') === 'true';
    if (!isLiveEnabled) {
      return json({ error: 'PhysiOmni is not running in live mode' }, 403, corsHeaders);
    }

    // Unauthenticated callers are limited per client IP (fails closed).
    const ipLimit = await checkRateLimit(`ip:${clientIp(req)}`, IP_RATE_LIMIT);
    if (!ipLimit.allowed) {
      return rateLimitExceededResponse(req.headers.get('Origin') ?? '', ipLimit);
    }

    if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
      return json({ error: 'Payload too large' }, 413, corsHeaders);
    }
    const rawBody = await req.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return json({ error: 'Payload too large' }, 413, corsHeaders);
    }
    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return json({ error: 'Invalid JSON' }, 400, corsHeaders);
    }
    const parsed = PhysiOmniTelemetrySchema.safeParse(payload);

    if (!parsed.success) {
      return json({ error: 'Invalid telemetry schema', details: parsed.error }, 400, corsHeaders);
    }

    const { device_id, tenant_id, timestamp, signature } = parsed.data;

    // Reject stale or future-dated telemetry (replay defense)
    const telemetryTime = new Date(timestamp).getTime();
    if (Math.abs(Date.now() - telemetryTime) > REPLAY_WINDOW_MS) {
      return json({ error: 'Telemetry timestamp outside the allowed window' }, 403, corsHeaders);
    }

    // Verify HMAC-SHA256 signature. Required: fails closed when no key is configured.
    const hmacSecret = Deno.env.get('PHYSIOMNI_INGRESS_HMAC_SECRET');
    if (!hmacSecret) {
      console.error('[physiomni-ingest] PHYSIOMNI_INGRESS_HMAC_SECRET is not configured');
      return json({ error: 'Telemetry signing is not configured' }, 503, corsHeaders);
    }
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(hmacSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const message = `${device_id}:${tenant_id}:${timestamp}:${parsed.data.nonce}`;
    let sigBytes: Uint8Array;
    try {
      sigBytes = Uint8Array.from(
        signature.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)),
      );
    } catch {
      return json({ error: 'Malformed signature encoding' }, 403, corsHeaders);
    }
    const valid = await crypto.subtle.verify('HMAC', keyMaterial, sigBytes, encoder.encode(message));
    if (!valid) {
      return json({ error: 'Signature verification failed' }, 403, corsHeaders);
    }

    // The (tenant_id, device_serial) pair must be a registered, active device.
    const supabase = createServiceClient();
    const { data: deviceData, error: deviceError } = await supabase
      .from('physiomni_devices')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('device_serial', device_id)
      .eq('is_active', true)
      .maybeSingle();

    if (deviceError) {
      console.error('[physiomni-ingest] device lookup failed:', deviceError.message);
      return json({ error: 'Unable to verify device' }, 503, corsHeaders);
    }
    if (!deviceData) {
      return json({ error: 'Device not authorized for this tenant' }, 403, corsHeaders);
    }

    // Per-device limit, keyed on the verified registered identity.
    const rl = await checkRateLimit(`${tenant_id}:${device_id}`, RATE_LIMIT_CONFIGS.physiomniIngest);
    if (!rl.allowed) {
      return rateLimitExceededResponse(req.headers.get('Origin') ?? '', rl);
    }

    // Persist telemetry — idempotent via UNIQUE(device_serial, captured_at)
    const { error: insertError } = await supabase
      .from('physiomni_telemetry')
      .upsert(
        {
          tenant_id,
          device_serial: device_id,
          vibration_x: parsed.data.payload.vibration_x,
          vibration_y: parsed.data.payload.vibration_y,
          vibration_z: parsed.data.payload.vibration_z,
          temperature_c: parsed.data.payload.temp_c,
          captured_at: timestamp,
          metadata: { nonce: parsed.data.nonce, source: 'physiomni-ingest' },
        },
        { onConflict: 'device_serial,captured_at', ignoreDuplicates: true },
      );

    if (insertError) {
      console.error('[physiomni-ingest] DB insert error:', insertError.message);
      return json({ error: 'Telemetry persistence failed' }, 500, corsHeaders);
    }

    // Update device last_seen_at
    await supabase
      .from('physiomni_devices')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('device_serial', device_id)
      .eq('tenant_id', tenant_id);

    return json(
      { success: true, message: 'Telemetry ingested successfully', timestamp: new Date().toISOString() },
      200,
      corsHeaders,
    );
  } catch (err: unknown) {
    console.error('[physiomni-ingest] unhandled error:', err instanceof Error ? err.message : err);
    return json({ error: 'Internal Server Error' }, 500, corsHeaders);
  }
});
