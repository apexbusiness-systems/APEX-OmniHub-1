/**
 * ============================================================
 * APEX OmniHub — MCP Gateway
 * ============================================================
 *
 * Remote MCP server implementing the Streamable HTTP transport.
 * Exposes 26 tools across 4 categories:
 *   • Supabase DB operations    (7 tools)
 *   • GitHub repo management    (6 tools)
 *   • Cloudflare deployments    (5 tools)
 *   • OmniHub platform monitor  (8 tools)
 *
 * Authentication: Bearer token (or x-api-key). Each key carries scopes:
 *   MCP_GATEWAY_WRITE_KEY  — read + write scopes (db writes, github, cloudflare, omnihub writes)
 *   MCP_GATEWAY_READ_KEY   — read scopes only
 *   MCP_GATEWAY_API_KEY    — legacy shared key, now read scopes only
 * Write groups are disabled unless the write key is presented. Every tool call is
 * scope-checked, rate limited and audited (see scopes.ts and audit.ts).
 *
 * Connector URL (add in Claude → Customize → Connectors):
 *   https://<project>.supabase.co/functions/v1/mcp-gateway
 *
 * Environment variables required:
 *   MCP_GATEWAY_WRITE_KEY / MCP_GATEWAY_READ_KEY / MCP_GATEWAY_API_KEY — see above
 *   SUPABASE_URL               — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY  — Supabase service role key
 *   GITHUB_TOKEN               — GitHub PAT for repo tools
 *   CLOUDFLARE_API_TOKEN       — Cloudflare API token
 *   CLOUDFLARE_ACCOUNT_ID      — Cloudflare account ID
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";
import {
  checkRateLimit,
  rateLimitExceededResponse,
  RATE_LIMIT_CONFIGS,
} from "../_shared/rate-limit.ts";
import { getClientIp } from "../_shared/requestUtils.ts";
import { hashArgs, writeAudit } from "./audit.ts";
import {
  isToolAllowed,
  isWriteTool,
  resolveGatewayIdentity,
  toolGroup,
  type GatewayIdentity,
} from "./scopes.ts";
import { ALL_TOOLS, dispatchTool } from "./tools/registry.ts";

// ─────────────────────────────────────────────────
// MCP Protocol Constants
// ─────────────────────────────────────────────────

const PROTOCOL_VERSION = "2024-11-05";
const SERVER_INFO = { name: "apex-omnihub-gateway", version: "1.1.0" };
const MAX_BATCH_SIZE = 20;
/** Limit for callers that have not authenticated yet (keyed by client IP). */
const IP_RATE_LIMIT = { maxRequests: 300, windowMs: 60_000, keyPrefix: "mcp-gateway-ip" };

// ─────────────────────────────────────────────────
// CORS — browser callers are restricted by the shared allowlist. Native MCP
// clients do not rely on CORS and authenticate with a header credential.
// ─────────────────────────────────────────────────

function mcpCorsHeaders(req: Request): Record<string, string> {
  return {
    ...buildCorsHeaders(req.headers.get("origin")),
    "Access-Control-Allow-Headers":
      "authorization, content-type, mcp-session-id, x-api-key",
  };
}

// ─────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────

serve(async (req: Request): Promise<Response> => {
  const responseHeaders = mcpCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders });
  }
  const origin = req.headers.get("origin");

  // Unauthenticated callers are limited per client IP (fails closed).
  const ipLimit = await checkRateLimit(`ip:${getClientIp(req)}`, IP_RATE_LIMIT);
  if (!ipLimit.allowed) return rateLimitExceededResponse(origin, ipLimit);

  // Auth — the presented key must match a configured key; it carries the scopes.
  const identity = await resolveGatewayIdentity(req, {
    writeKey: Deno.env.get("MCP_GATEWAY_WRITE_KEY"),
    readKey: Deno.env.get("MCP_GATEWAY_READ_KEY"),
    legacyKey: Deno.env.get("MCP_GATEWAY_API_KEY"),
  });
  if (!identity) {
    return jsonResponse({ error: "Unauthorized" }, 401, responseHeaders);
  }

  const keyLimit = await checkRateLimit(identity.keyId, RATE_LIMIT_CONFIGS.mcpGateway);
  if (!keyLimit.allowed) return rateLimitExceededResponse(origin, keyLimit);

  if (req.method === "POST") {
    return handlePost(req, responseHeaders, identity);
  }

  // GET /mcp-gateway — returns server metadata for discovery
  if (req.method === "GET") {
    return jsonResponse({
      name: SERVER_INFO.name,
      version: SERVER_INFO.version,
      protocol: PROTOCOL_VERSION,
      tools: visibleTools(identity).length,
      categories: ["supabase-db", "github", "cloudflare", "omnihub"],
    }, 200, responseHeaders);
  }

  return jsonResponse({ error: "Method not allowed" }, 405, responseHeaders);
});

// ─────────────────────────────────────────────────
// POST handler — dispatches JSON-RPC messages
// ─────────────────────────────────────────────────

async function handlePost(
  req: Request,
  responseHeaders: HeadersInit,
  identity: GatewayIdentity,
): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(rpcError(null, -32700, "Parse error"), 400, responseHeaders);
  }

  // Handle batch requests
  if (Array.isArray(body)) {
    if (body.length > MAX_BATCH_SIZE) {
      return jsonResponse(
        rpcError(null, -32600, `Invalid Request: batch exceeds ${MAX_BATCH_SIZE} messages`),
        400,
        responseHeaders,
      );
    }
    const results = await Promise.all(body.map((msg) => handleRpcMessage(msg as RpcRequest, identity)));
    const responses = results.filter((r) => r !== null);
    return jsonResponse(responses, 200, responseHeaders);
  }

  const result = await handleRpcMessage(body as RpcRequest, identity);
  if (result === null) {
    // Notification — no response body required
    return new Response(null, { status: 202, headers: responseHeaders });
  }
  return jsonResponse(result, 200, responseHeaders);
}

// ─────────────────────────────────────────────────
// JSON-RPC message dispatcher
// ─────────────────────────────────────────────────

interface RpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: unknown;
}

/** Only the tools the presented key is allowed to call. */
function visibleTools(identity: GatewayIdentity) {
  return ALL_TOOLS.filter((tool) => isToolAllowed(identity, tool.name));
}

async function handleRpcMessage(msg: RpcRequest, identity: GatewayIdentity): Promise<unknown> {
  if (msg.jsonrpc !== "2.0") {
    return rpcError(msg.id ?? null, -32600, "Invalid Request: jsonrpc must be '2.0'");
  }

  const { id, method, params } = msg;
  const isNotification = id === undefined || id === null;

  switch (method) {
    case "initialize":
      return rpcOk(id!, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });

    case "notifications/initialized":
    case "initialized":
      return null; // Notification — no response

    case "ping":
      return rpcOk(id!, {});

    case "tools/list":
      return rpcOk(id!, { tools: visibleTools(identity) });

    case "tools/call": {
      const p = params as { name?: string; arguments?: Record<string, unknown> } | undefined;
      if (!p?.name) {
        return rpcError(id ?? null, -32602, "Invalid params: 'name' is required");
      }
      const toolExists = ALL_TOOLS.some((t) => t.name === p.name);
      if (!toolExists) {
        return rpcError(id ?? null, -32602, `Unknown tool: ${p.name}`);
      }
      return handleToolCall(id ?? null, p.name, p.arguments ?? {}, identity);
    }

    case "resources/list":
      return rpcOk(id!, { resources: [] });

    case "prompts/list":
      return rpcOk(id!, { prompts: [] });

    default:
      if (isNotification) return null;
      return rpcError(id ?? null, -32601, `Method not found: ${method}`);
  }
}

// ─────────────────────────────────────────────────
// Tool call: scope check, audit, dispatch
// ─────────────────────────────────────────────────

async function handleToolCall(
  id: string | number | null,
  name: string,
  args: Record<string, unknown>,
  identity: GatewayIdentity,
): Promise<unknown> {
  const audit = {
    tool: name,
    group: toolGroup(name),
    keyId: identity.keyId,
    argsHash: await hashArgs(args),
  };

  if (!isToolAllowed(identity, name)) {
    await writeAudit({ ...audit, status: "denied" });
    return rpcError(id, -32001, `Forbidden: this key is not scoped for ${name}`);
  }

  // Write tools run only when the attempt is on record.
  if (isWriteTool(name) && !(await writeAudit({ ...audit, status: "attempt" }))) {
    return rpcError(id, -32002, "Audit log unavailable: write tools are refused");
  }

  const result = await dispatchTool(name, args);
  await writeAudit({ ...audit, status: result.isError ? "error" : "ok" });
  return rpcOk(id!, result);
}

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

function jsonResponse(data: unknown, status: number, responseHeaders: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...responseHeaders, "Content-Type": "application/json" },
  });
}

function rpcOk(id: string | number, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(id: string | number | null, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}
