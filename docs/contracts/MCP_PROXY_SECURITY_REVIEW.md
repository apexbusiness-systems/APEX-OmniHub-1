# mcp-proxy Security Review (L7)

Reviewed at `main` `bb22baf0`, 2026-09-28, against `supabase/functions/mcp-proxy/index.ts` (332 lines). Static review only. The function is **not deployed** (the live URL returns 404), and nothing here was run against production.

**Verdict: do not deploy.** Three of the four owner criteria have gaps, and three further findings (C1 to C3) make the design unsafe regardless of hardening.

## Owner criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Caller authentication (JWT required) | **Present, but no authorization** | `index.ts:130-140` requires `Authorization: Bearer` and verifies it with `supabase.auth.getUser`. There is no `[functions.mcp-proxy]` entry in `supabase/config.toml`, so the platform default for `verify_jwt` applies (not verified live). **Gap:** there is no role or tier check, so any signed-up free user can `connect` (`:177-231`). |
| 2 | SSRF protection | **Not applicable at the proxy, missing downstream** | The proxy makes no outbound fetch. `serverId` is checked against a fixed allowlist (`:47-53`, check at `:184`) and commands are static (`:56-77`), so no user-supplied host reaches the proxy. **Gap:** `method` is any string (`:98`) and `params` are forwarded verbatim to the child (`:99`, `:276`). There is no method allowlist and no destination allowlist or private-range block for tool arguments. |
| 3 | Rate limiting | **Partial** | 20 requests per minute per user (`:79`, `:143-144`), backed by Upstash and fail-closed (`_shared/rate-limit.ts:4-8`). **Gap:** there is no cap on total child processes. `activeProcesses` is a per-isolate `Map` (`:115`), so processes and their 30-minute timers (`:226-228`) are not shared across isolates. |
| 4 | Response-size and timeout limits | **Partial** | The RPC read has a 30 s timeout (`:280-289`) whose timer is never cleared. **Gaps:** there is no request-body cap (`req.json()` at `:182`, `:238`, `:250`) and no response-size cap (one `read()` chunk is decoded whole, `:284-287`). `connect` has no startup timeout although `npx -y` downloads at runtime (`:205-213`), and the stdin write is unbounded (`:277`). Only the last stdout line is parsed (`:292`), so multi-chunk replies break. |

## Findings beyond the four criteria

- **C1, cannot run on this platform (blocking).** The function spawns subprocesses with `Deno.Command` (`:205`). Supabase Edge Runtime does not allow this ([supabase/discussions#36800](https://github.com/orgs/supabase/discussions/36800), found by web search, not tested on this project). Hardening cannot fix it.
- **C2, credential exposure (high).** The child process receives `SUPABASE_SERVICE_KEY` (`:75`, `:199-203`) and `GITHUB_TOKEN` (`:70`). Any authenticated user could drive a service-role-equivalent MCP server through `/rpc`.
- **C3, supply chain (high).** Three of the four packages do not exist on the npm registry (`npm view` returned E404 on 2026-09-28): `@anthropic/google-workspace-mcp` (`:64`), `@anthropic/github-mcp` (`:69`) and `@supabase/mcp-server` (`:74`). All four run through unpinned `npx -y` at request time (`:58`, `:63`, `:68`, `:73`). If someone else can register an unclaimed name, they get code execution with the credentials in C2. Ownership of the `@anthropic` npm scope was not verified.

## Caller

`src/core/mcp/MCPTransport.ts:153` posts to `<supabase>/functions/v1/mcp-proxy` and falls back to `/api/mcp-proxy` when no Supabase URL is set.

## Recommendation

Keep it undeployed. The 404 is safer than an open proxy.

No fix PR is proposed yet, because a partial patch (admin gate, size caps, dropping the credentials) would add code that cannot be tested on the platform and would give false assurance while C1 stands. The owner needs to pick a direction:

1. **Retire the design.** Route the client to the deployed `mcp-gateway` (an HTTP design) and delete `mcp-proxy`. This needs its own scoping.
2. **Host it outside Edge Functions.** This needs a host, so it depends on the orchestrator hosting decision (`memory/omni-recall/rfc/RFC_2026_09_28_ORCHESTRATOR_HOSTING.md`). If chosen, C2 and C3 must be fixed first.
