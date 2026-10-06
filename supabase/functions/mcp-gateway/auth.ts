/** Pure, runtime-portable authorization helper for the privileged MCP gateway. */
export function timingSafeEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return difference === 0;
}

/** The credential presented on the request (Bearer token or x-api-key), or null. Never read from the URL. */
export function presentedKey(req: Request): string | null {
  const authorization = req.headers.get('Authorization');
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7);
  return req.headers.get('x-api-key');
}

export function isMcpGatewayAuthorized(req: Request, configuredApiKey: string | undefined): boolean {
  const apiKey = configuredApiKey?.trim();
  if (!apiKey) return false;
  const presented = presentedKey(req);
  return presented !== null && timingSafeEqual(presented, apiKey);
}
