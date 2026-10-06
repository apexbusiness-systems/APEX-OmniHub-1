/**
 * MCP gateway per-call audit record (MCP-H1).
 *
 * One `audit_logs` row per tool call: tool, group, key id, a SHA-256 hash of the
 * canonical arguments (never the arguments themselves) and the outcome. Write tools
 * record an `attempt` row before running and the gateway refuses to run them when
 * that row cannot be stored.
 */
import { createServiceClient } from '../_shared/supabaseClient.ts';

export type AuditStatus = 'attempt' | 'ok' | 'error' | 'denied';

export interface GatewayAuditEntry {
  tool: string;
  group: string;
  keyId: string;
  argsHash: string;
  status: AuditStatus;
}

/** JSON with object keys sorted at every level, so equal arguments hash equally. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export async function hashArgs(args: unknown): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalJson(args)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Store one audit row. Returns false (and logs) when it cannot be stored. */
export async function writeAudit(entry: GatewayAuditEntry): Promise<boolean> {
  try {
    const { error } = await createServiceClient().from('audit_logs').insert({
      actor_id: null,
      action_type: 'mcp_tool_call',
      resource_type: 'mcp_tool',
      resource_id: entry.tool,
      metadata: {
        key_id: entry.keyId,
        group: entry.group,
        args_hash: entry.argsHash,
        status: entry.status,
      },
    });
    if (error) {
      console.error('[mcp-gateway] audit insert failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[mcp-gateway] audit insert threw:', err instanceof Error ? err.message : err);
    return false;
  }
}
