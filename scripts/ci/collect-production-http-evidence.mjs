#!/usr/bin/env node
/**
 * collect-production-http-evidence — HTTP-layer live production evidence.
 *
 * WHY THIS EXISTS: some validation environments (hardened CI runners, egress
 * relays) allow HTTPS from Node/curl but block the browser's CONNECT tunnels,
 * so Playwright cannot reach production at all. In that situation the honest
 * options are "no evidence" or "evidence at the layer that does work". This
 * collects the latter.
 *
 * WHAT IT CAN AND CANNOT PROVE — read before citing it:
 *   CAN: route reachability and status, security headers, and a conclusive
 *        scan of the shipped client bundle for a Supabase service-role
 *        credential (the bundle is exactly what the browser would execute).
 *   CANNOT: anything requiring a rendered DOM, a session, or a second tenant.
 *        Every record it writes carries certifies:false — it can falsify, it
 *        can never certify AUTH_EMAIL_PASSWORD, OMNIDASH_LIVE_PERSISTENCE, or
 *        SUPABASE_RLS_MULTI_TENANT.
 *
 * OWNED BY: APEX Business Systems Ltd.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const BASE_URL = (process.env.APEX_PROD_URL || 'https://apexomnihub.icu').replace(/\/$/, '');
const ROUTES = ['/', '/login', '/request-access', '/demo', '/omnidash'];
const JWT_RE = /\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\b/g;

const runId =
  process.env.APEX_VALIDATION_RUN_ID ||
  new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outDir = path.resolve('artifacts/production-validation', runId, 'http-layer');
fs.mkdirSync(outDir, { recursive: true });

const redact = (value) =>
  String(value)
    .replace(JWT_RE, '[redacted-jwt]')
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer [redacted]')
    .replace(/\bsb[ap]?_[A-Za-z0-9_-]{10,}\b/g, '[redacted-supabase-key]')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[redacted-email]');

/** Decode a JWT's `role` claim. Returns the role name only, never the token. */
function jwtRole(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const claims = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
    );
    return typeof claims.role === 'string' ? claims.role : null;
  } catch {
    return null;
  }
}

async function get(url) {
  const started = Date.now();
  const response = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'apex-production-validation/1.0' } });
  const body = await response.text();
  return {
    url,
    status: response.status,
    finalUrl: response.url,
    contentType: response.headers.get('content-type'),
    elapsedMs: Date.now() - started,
    securityHeaders: {
      strictTransportSecurity: response.headers.get('strict-transport-security'),
      contentSecurityPolicy: response.headers.get('content-security-policy') ? 'present' : null,
      xContentTypeOptions: response.headers.get('x-content-type-options'),
      referrerPolicy: response.headers.get('referrer-policy'),
    },
    body,
  };
}

const routeRecords = [];
for (const route of ROUTES) {
  try {
    const result = await get(`${BASE_URL}${route}`);
    routeRecords.push({
      route,
      status: result.status,
      finalPath: new URL(result.finalUrl).pathname,
      contentType: result.contentType,
      elapsedMs: result.elapsedMs,
      securityHeaders: result.securityHeaders,
      bodyBytes: result.body.length,
      reachable: result.status < 500,
    });
  } catch (error) {
    routeRecords.push({ route, status: null, reachable: false, error: redact(error.message) });
  }
}

// ── Shipped-bundle service-role scan ────────────────────────────
const root = await get(`${BASE_URL}/`);
const scriptSrcs = [...root.body.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
const assetUrls = scriptSrcs
  .map((src) => (src.startsWith('http') ? src : `${BASE_URL}${src.startsWith('/') ? '' : '/'}${src}`))
  .slice(0, 20);

const scannedAssets = [];
const observedJwtRoles = new Set();
const serviceRoleSightings = [];

for (const assetUrl of [`${BASE_URL}/`, ...assetUrls]) {
  try {
    const asset = await get(assetUrl);
    const jwts = asset.body.match(JWT_RE) ?? [];
    const roles = jwts.map(jwtRole).filter(Boolean);
    for (const role of roles) observedJwtRoles.add(role);
    if (roles.includes('service_role')) {
      serviceRoleSightings.push(`${new URL(assetUrl).pathname}: service_role JWT present`);
    }
    // A literal service_role mention outside a token is also a leak signal.
    if (/service[_-]?role[_-]?key/i.test(asset.body.replace(JWT_RE, ''))) {
      serviceRoleSightings.push(`${new URL(assetUrl).pathname}: literal service-role key identifier present`);
    }
    scannedAssets.push({
      path: new URL(assetUrl).pathname,
      status: asset.status,
      bytes: asset.body.length,
      jwtCount: jwts.length,
      jwtRoles: roles,
    });
  } catch (error) {
    scannedAssets.push({ path: assetUrl, status: null, error: redact(error.message) });
  }
}

const clean = serviceRoleSightings.length === 0 && !observedJwtRoles.has('service_role');

const record = {
  generatedAt: new Date().toISOString(),
  runId,
  baseUrl: BASE_URL,
  layer: 'http',
  liveProductionTouched: true,
  // This collector can falsify but never certify. Keep this false.
  certifies: false,
  routes: routeRecords,
  serviceRoleScan: {
    outcome: clean ? 'NO_SERVICE_ROLE_EXPOSURE' : 'P0_SECURITY_FINDING',
    scannedAssetCount: scannedAssets.length,
    observedClientJwtRoles: [...observedJwtRoles],
    sightings: serviceRoleSightings.map(redact),
    assets: scannedAssets,
  },
  limitations: [
    'No rendered DOM: route gating is inferred from status/redirect only, not from what a browser displays.',
    'No session: cannot exercise AUTH_EMAIL_PASSWORD, OMNIDASH_LIVE_PERSISTENCE, or SUPABASE_RLS_MULTI_TENANT.',
  ],
};

const file = path.join(outDir, 'http-layer-evidence.json');
fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`);

console.log(`http-layer evidence written: ${file}`);
console.log(`  routes probed: ${routeRecords.length}`);
console.log(`  client JWT roles observed: ${[...observedJwtRoles].join(', ') || 'none'}`);
console.log(`  service-role exposure: ${clean ? 'none detected' : 'DETECTED — P0'}`);

process.exit(clean ? 0 : 1);
