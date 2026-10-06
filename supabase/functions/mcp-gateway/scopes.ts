/**
 * MCP gateway credential scopes (MCP-H1).
 *
 * Least privilege: every tool belongs to a group and needs one scope. The write key
 * carries read and write scopes; the read key and the legacy shared key carry read
 * scopes only, so write groups stay disabled unless a write-scoped key is presented.
 * A tool with no entry in TOOL_SCOPES is denied. Only imports ./auth.ts, so both
 * Deno and Vitest can load it.
 */
import { presentedKey, timingSafeEqual } from './auth.ts';

export type Scope =
  | 'db:read'
  | 'db:write'
  | 'github:read'
  | 'github:write'
  | 'cloudflare:read'
  | 'cloudflare:write'
  | 'omnihub:read'
  | 'omnihub:write';

export const READ_SCOPES: readonly Scope[] = ['db:read', 'github:read', 'cloudflare:read', 'omnihub:read'];
export const WRITE_SCOPES: readonly Scope[] = ['db:write', 'github:write', 'cloudflare:write', 'omnihub:write'];

export const TOOL_SCOPES: Readonly<Record<string, Scope>> = {
  cf_list_deployments: 'cloudflare:read',
  cf_get_deployment: 'cloudflare:read',
  cf_list_workers: 'cloudflare:read',
  cf_trigger_deploy: 'cloudflare:write',
  cf_purge_cache: 'cloudflare:write',
  db_list_tables: 'db:read',
  db_get_schema: 'db:read',
  db_select: 'db:read',
  db_insert: 'db:write',
  db_update: 'db:write',
  db_delete: 'db:write',
  db_upsert: 'db:write',
  github_list_repos: 'github:read',
  github_get_file: 'github:read',
  github_list_branches: 'github:read',
  github_create_branch: 'github:write',
  github_push_files: 'github:write',
  github_create_pr: 'github:write',
  omnihub_platform_health: 'omnihub:read',
  omnihub_list_functions: 'omnihub:read',
  omnihub_list_tasks: 'omnihub:read',
  omnihub_get_metrics: 'omnihub:read',
  omnihub_emit_event: 'omnihub:write',
  omnihub_claim_task: 'omnihub:write',
  omnihub_complete_task: 'omnihub:write',
  omnihub_execute_intent: 'omnihub:write',
};

export interface GatewayKeys {
  writeKey?: string;
  readKey?: string;
  /** The pre-split shared key. It now carries read scopes only. */
  legacyKey?: string;
}

export interface GatewayIdentity {
  /** Non-secret identifier for audit and rate limiting: `<slot>:<12 hex of SHA-256(key)>`. */
  keyId: string;
  scopes: ReadonlySet<Scope>;
}

async function fingerprint(key: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return Array.from(new Uint8Array(digest).slice(0, 6), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Resolve the presented credential to an identity, or null when it matches no configured key. */
export async function resolveGatewayIdentity(req: Request, keys: GatewayKeys): Promise<GatewayIdentity | null> {
  const presented = presentedKey(req);
  if (presented === null) return null;

  const slots: Array<{ slot: string; secret: string | undefined; scopes: readonly Scope[] }> = [
    { slot: 'write', secret: keys.writeKey?.trim(), scopes: [...READ_SCOPES, ...WRITE_SCOPES] },
    { slot: 'read', secret: keys.readKey?.trim(), scopes: READ_SCOPES },
    { slot: 'legacy', secret: keys.legacyKey?.trim(), scopes: READ_SCOPES },
  ];

  let matched: { slot: string; secret: string; scopes: readonly Scope[] } | null = null;
  for (const { slot, secret, scopes } of slots) {
    // Compare every configured slot so timing does not reveal which one matched.
    if (secret && timingSafeEqual(presented, secret) && matched === null) {
      matched = { slot, secret, scopes };
    }
  }
  if (matched === null) return null;

  return { keyId: `${matched.slot}:${await fingerprint(matched.secret)}`, scopes: new Set(matched.scopes) };
}

export function isToolAllowed(identity: GatewayIdentity, tool: string): boolean {
  const required = TOOL_SCOPES[tool];
  return required !== undefined && identity.scopes.has(required);
}

export function isWriteTool(tool: string): boolean {
  return TOOL_SCOPES[tool]?.endsWith(':write') === true;
}

export function toolGroup(tool: string): string {
  return TOOL_SCOPES[tool]?.split(':')[0] ?? 'unknown';
}
