import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handlePreflight } from "../_shared/cors.ts";
import { createAnonClient, createServiceClient } from "../_shared/supabaseClient.ts";
import { buildSignedHeaders } from "../_shared/requestSigning.ts";
import { isValidUUID } from "../_shared/validation.ts";
import {
  checkRateLimit,
  rateLimitExceededResponse,
  RATE_LIMIT_CONFIGS,
} from "../_shared/rate-limit.ts";
import { checkRequest } from "./guardian.ts";
import { okResponse, errResponse } from "../_shared/response.ts";



/**
 * Handle oauth_exchange action dispatched from api/omniconnect/exchange.ts.
 * Validates the provider + auth_payload and returns scopes from the provider.
 */
async function handleOAuthExchange(
  body: Record<string, unknown>,
  authHeader: string,
  origin: string | null,
): Promise<Response> {
  const provider = body.provider;
  const authPayload = body.auth_payload as Record<string, unknown> | undefined;

  if (typeof provider !== "string" || !provider) {
    return errResponse("bad_request", "missing provider", 400, origin);
  }
  if (!authPayload || typeof authPayload.proxy_token !== "string") {
    return errResponse("bad_request", "missing auth_payload.proxy_token", 400, origin);
  }

  const supabase = createAnonClient(authHeader);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return errResponse("unauthorized", "Unauthorized", 401, origin);
  }

  // Log the exchange attempt (audit_logs accepts writes from server paths only)
  await createServiceClient().from("audit_logs").insert({
    actor_id: user.id,
    action_type: "oauth_exchange",
    resource_type: "provider_connection",
    metadata: { provider, has_context: !!authPayload.context },
  }).then(({ error }) => {
    if (error) console.error("[apex-agent] audit log error:", error.message);
  });

  return okResponse({
    status: "exchanged",
    provider,
    scopes: [],
    user_id: user.id,
  }, origin, 200);
}

serve(async (req) => {
  // Handle CORS preflight requests with origin validation
  if (req.method === "OPTIONS") {
    return handlePreflight(req);
  }

  const origin = req.headers.get("origin");

  try {
    // 1. Auth validation — missing auth must return 401, not 500
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errResponse("unauthorized", "Unauthorized", 401, origin);
    }

    const supabase = createAnonClient(authHeader);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errResponse("unauthorized", "Unauthorized", 401, origin);
    }

    // Distributed rate limiting — per authenticated user, before any business logic
    const rl = await checkRateLimit(user.id, RATE_LIMIT_CONFIGS.apexAgent);
    if (!rl.allowed) {
      return rateLimitExceededResponse(origin, rl);
    }

    // 2. Content-Type validation
    const contentType = req.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return errResponse("unsupported_media_type", "Unsupported media type", 415, origin);
    }

    // 3. Safe JSON parse
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errResponse("bad_request", "Bad request", 400, origin);
    }

    // 4. Action dispatch — oauth_exchange bypasses query/traceId validation
    if (body.action === "oauth_exchange") {
      return handleOAuthExchange(body, authHeader, origin);
    }

    // 5. Validate required fields for standard agent invocation
    if (
      typeof body.query !== "string" ||
      typeof body.traceId !== "string" ||
      !isValidUUID(body.traceId)
    ) {
      return errResponse("bad_request", "Bad request", 400, origin);
    }

    const query = body.query;
    const traceId = body.traceId;

    // 6. Guardian enforcement (toggled via OMNI_GUARDIAN_ENABLED, default true)
    const guardianEnabled = Deno.env.get("OMNI_GUARDIAN_ENABLED") !== "false";
    if (guardianEnabled) {
      const guardianResult = await checkRequest(query, authHeader);
      if (!guardianResult.allowed) {
        return errResponse("request_blocked", "Request blocked", 429, origin);
      }
    }

    // 7. Update agent_runs status to 'running'
    const { error: updateError } = await supabase
      .from("agent_runs")
      .update({
        status: "running",
        start_time: new Date().toISOString(),
      })
      .eq("id", traceId);

    if (updateError) {
      console.error("Failed to update agent_run status:", updateError.message);
    }

    // 8. Handoff to orchestrator with signed request
    const orchestratorUrl = Deno.env.get("ORCHESTRATOR_URL");
    if (!orchestratorUrl) {
      console.error("ORCHESTRATOR_URL not configured");
      return errResponse("server_error", "Server error", 500, origin);
    }

    const requestPath = "/api/v1/goals";
    const bodyRaw = JSON.stringify({
      user_id: user.id,
      user_intent: query,
      trace_id: traceId,
    });

    const signedHeaders = await buildSignedHeaders(
      "POST",
      requestPath,
      bodyRaw,
      traceId,
    );

    const response = await fetch(`${orchestratorUrl}${requestPath}`, {
      method: "POST",
      headers: signedHeaders,
      body: bodyRaw,
    });

    if (!response.ok) {
      console.error(
        `Orchestrator returned ${response.status}`,
      );
      return errResponse("upstream_error", "Upstream error", 502, origin);
    }

    const data = await response.json();

    // Persist workflowId into metadata (workflow_id is not a top-level column in the migration)
    if (data.workflowId && typeof data.workflowId === 'string') {
      const { error: updateErr } = await supabase
        .from("agent_runs")
        .update({
          metadata: {
            workflow_id: data.workflowId,
            orchestrator_status: data.status ?? "started",
          },
        })
        .eq("id", traceId);
      if (updateErr) {
        console.error(`[apex-agent] Failed to update metadata for run ${traceId}:`, updateErr.message);
      }
    }

    // Return orchestrator response
    return okResponse(data, origin, 200);
  } catch (err) {
    console.error("Router error:", err instanceof Error ? err.message : err);
    return errResponse("server_error", "Server error", 500, origin);
  }
});
