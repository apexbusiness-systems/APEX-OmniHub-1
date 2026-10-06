/**
 * OmniHub Platform Monitoring Tools (8 tools)
 * Calls existing APEX edge functions, Supabase admin APIs, and the
 * APEX Orchestrator universal intent endpoint.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { MCPTool, ToolCallResult } from "./registry.ts";
import { ok, err } from "./registry.ts";
import {
  normalizeToEventEnvelope,
  toPythonEventEnvelope,
} from "../../_shared/event-ingress-adapter.ts";
import { buildSignedHeaders } from "../../_shared/requestSigning.ts";

/** Attributed userId for intents dispatched by the MCP gateway itself. */
const MCP_GATEWAY_ACTOR = "mcp-gateway";

function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

function edgeFnBase(): string {
  return (
    Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "") +
    "/functions/v1"
  );
}

export const omnihubTools: MCPTool[] = [
  {
    name: "omnihub_platform_health",
    description: "Get overall APEX OmniHub platform health status.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "omnihub_list_functions",
    description: "List all deployed Supabase Edge Functions with their slugs.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "omnihub_emit_event",
    description: "Emit an OmniLink event to the platform event bus.",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string", description: "Event source identifier" },
        type: { type: "string", description: "Event type (e.g. lead_ingested)" },
        data: { type: "object", description: "Event payload" },
        idempotency_key: { type: "string", description: "Optional idempotency key" },
      },
      required: ["source", "type", "data"],
    },
  },
  {
    name: "omnihub_list_tasks",
    description: "List pending OmniLink tasks, optionally filtered by target.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "string", description: "Filter by task target" },
        status: { type: "string", description: "pending | claimed | succeeded | failed (default: pending)" },
        limit: { type: "number", description: "Max results (default 20)" },
      },
    },
  },
  {
    name: "omnihub_claim_task",
    description: "Claim a pending OmniLink task for processing.",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker identifier" },
        target: { type: "string", description: "Task target to claim" },
      },
      required: ["worker_id", "target"],
    },
  },
  {
    name: "omnihub_complete_task",
    description: "Mark an OmniLink task as succeeded or failed.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        worker_id: { type: "string" },
        status: { type: "string", description: "succeeded | failed" },
        output: { type: "object", description: "Output summary (for succeeded)" },
        error_message: { type: "string", description: "Error message (for failed)" },
      },
      required: ["task_id", "worker_id", "status"],
    },
  },
  {
    name: "omnihub_get_metrics",
    description: "Get platform usage metrics: event counts, task throughput, error rates.",
    inputSchema: {
      type: "object",
      properties: {
        window_hours: { type: "number", description: "Lookback window in hours (default 24)" },
      },
    },
  },
  {
    name: "omnihub_execute_intent",
    description:
      "Execute a registered universal intent on the APEX Orchestrator (Temporal). " +
      "Routes through the fail-closed Intent Registry: unregistered intentIds return " +
      "status=offline without starting a workflow. Try intent_id=system.list_intents " +
      "to discover the registry.",
    inputSchema: {
      type: "object",
      properties: {
        intent_id: {
          type: "string",
          description:
            "Registered intentId (e.g. system.health_check, system.echo, system.list_intents)",
        },
        payload: {
          type: "object",
          description: "Intent payload fields (merged into the EventEnvelope payload)",
        },
        trace_id: { type: "string", description: "Optional trace UUID (generated when omitted)" },
      },
      required: ["intent_id"],
    },
  },
];

export async function handleOmnihubTool(
  name: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const sb = adminClient();
  try {
    if (name === "omnihub_platform_health") {
      const base = edgeFnBase();
      const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      const res = await fetch(`${base}/platform-health`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      const data = await res.json();
      return ok(data);
    }

    if (name === "omnihub_list_functions") {
      // Known deployed functions (static manifest — keeps this offline-safe)
      const functions = [
        "activate-client", "alchemy-webhook", "apex-agent", "apex-assistant",
        "apex-voice", "byom-cockpit", "byom-login", "byom-proxy",
        "create-checkout", "execute-automation", "generate-business-skills",
        "mcp-gateway", "mcp-proxy", "omni-runs", "omnibridge-control",
        "omnilink-eval", "omnilink-port", "omnilink-retry-scheduler",
        "ops-voice-health", "physiomni-action", "physiomni-ingest",
        "platform-health", "send-push-notification",
        "storage-upload-url", "stripe-webhook", "trigger-workflow",
        "verify-nft", "web3-nonce", "web3-verify",
      ];
      const base = edgeFnBase();
      return ok({ functions, base_url: base, count: functions.length });
    }

    if (name === "omnihub_emit_event") {
      const base = edgeFnBase();
      const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      const payload = {
        specversion: "1.0",
        id: crypto.randomUUID(),
        source: args.source,
        type: args.type,
        time: new Date().toISOString(),
        data: args.data,
      };
      const headers: Record<string, string> = {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      };
      if (args.idempotency_key) {
        headers["X-Idempotency-Key"] = args.idempotency_key as string;
      }
      const res = await fetch(`${base}/omnilink-port/events`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return ok(data);
    }

    if (name === "omnihub_list_tasks") {
      const status = (args.status as string | undefined) ?? "pending";
      const limit = Math.min(Number(args.limit ?? 20), 100);
      let q = sb.from("omnilink_tasks").select("*").eq("status", status).limit(limit);
      if (args.target) q = q.eq("target", args.target as string);
      const { data, error } = await q;
      if (error) return err(error.message);
      return ok(data);
    }

    if (name === "omnihub_claim_task") {
      const base = edgeFnBase();
      const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      const res = await fetch(`${base}/omnilink-port/tasks/claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ worker_id: args.worker_id, target: args.target }),
      });
      const data = await res.json();
      return ok(data);
    }

    if (name === "omnihub_complete_task") {
      const base = edgeFnBase();
      const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      const res = await fetch(`${base}/omnilink-port/tasks/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: args.task_id,
          worker_id: args.worker_id,
          status: args.status,
          output: args.output,
          error_message: args.error_message,
        }),
      });
      const data = await res.json();
      return ok(data);
    }

    if (name === "omnihub_get_metrics") {
      const windowHours = Number(args.window_hours ?? 24);
      const since = new Date(Date.now() - windowHours * 3600 * 1000).toISOString();

      const [eventsRes, tasksRes] = await Promise.all([
        sb.from("omnilink_events").select("type,created_at", { count: "exact", head: false })
          .gte("created_at", since),
        sb.from("omnilink_tasks").select("status,created_at", { count: "exact", head: false })
          .gte("created_at", since),
      ]);

      const tasksByStatus: Record<string, number> = {};
      for (const t of (tasksRes.data ?? []) as Array<{ status: string }>) {
        tasksByStatus[t.status] = (tasksByStatus[t.status] ?? 0) + 1;
      }

      return ok({
        window_hours: windowHours,
        since,
        events: { total: eventsRes.count ?? 0 },
        tasks: { total: tasksRes.count ?? 0, by_status: tasksByStatus },
      });
    }

    if (name === "omnihub_execute_intent") {
      return await executeIntent(args);
    }

    return err(`Unhandled omnihub tool: ${name}`);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * FR6 — first live producer for the Universal Orchestrator intent path.
 * Reuses the exact wire contract the edge layer already speaks: the shared
 * event-ingress adapter builds the Python EventEnvelope and the shared HMAC
 * signer authorizes the call, so the orchestrator sees a request identical to
 * one from trigger-workflow. Fail-closed: the orchestrator rejects intentIds
 * missing from the Intent Registry before any Temporal workflow starts.
 */
async function executeIntent(args: Record<string, unknown>): Promise<ToolCallResult> {
  const intentId = args.intent_id;
  if (typeof intentId !== "string" || intentId.length === 0) {
    return err("intent_id (string) is required");
  }

  const orchestratorUrl = Deno.env.get("ORCHESTRATOR_URL");
  if (!orchestratorUrl) {
    // Honest-Gateway Law: never fake success when the backend is unreachable.
    return err("ORCHESTRATOR_URL is not configured for this environment");
  }

  const tsEnvelope = normalizeToEventEnvelope(
    {
      ...(typeof args.payload === "object" && args.payload !== null ? args.payload : {}),
      ...(typeof args.trace_id === "string" ? { trace_id: args.trace_id } : {}),
      intentId,
      // Same rule as trigger-workflow: the server-side identity always wins
      // over any caller-supplied tenant field.
      tenantId: MCP_GATEWAY_ACTOR,
    },
    { channel: "api", userAgent: "mcp-gateway/omnihub_execute_intent" },
  );

  const pythonEnvelope = toPythonEventEnvelope(tsEnvelope, MCP_GATEWAY_ACTOR);
  const intentPath = "/api/v1/intents";
  const intentBody = JSON.stringify(pythonEnvelope);
  const signedHeaders = await buildSignedHeaders("POST", intentPath, intentBody, tsEnvelope.traceId);

  const res = await fetch(`${orchestratorUrl}${intentPath}`, {
    method: "POST",
    headers: {
      ...signedHeaders,
      "X-Idempotency-Key": tsEnvelope.idempotencyKey,
      "X-Trace-Id": tsEnvelope.traceId,
    },
    body: intentBody,
  });

  const data = await res.json().catch(() => ({ error: "non-JSON orchestrator response" }));
  if (!res.ok) {
    return err(`Orchestrator ${res.status}: ${JSON.stringify(data)}`);
  }
  return ok({ trace_id: tsEnvelope.traceId, ...data });
}
