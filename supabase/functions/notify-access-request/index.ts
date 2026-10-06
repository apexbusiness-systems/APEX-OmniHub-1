/**
 * notify-access-request — emails the owner when a lead is captured
 * (APEX-REV-2026-09 WP-05 F-10). No new vendor: reuses the existing Resend
 * channel (RESEND_API_KEY, already set in production).
 *
 * Caller: the AFTER INSERT trigger on public.access_requests (pg_net), which
 * authenticates with the vault `cron_shared_secret` in X-Cron-Secret — the
 * same pattern as execute-workflow. verify_jwt=false in config.toml.
 *
 * Secrets: CRON_SHARED_SECRET, RESEND_API_KEY, LEAD_ALERT_TO (comma list),
 * LEAD_ALERT_FROM (a sender on a Resend-verified domain). Missing alert
 * config is logged and skipped; it never fails the lead insert.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from "../_shared/auth.ts";
import { buildLeadAlertEmail, parseRecipients, secretsMatch, type LeadRow } from "./leadAlert.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!secretsMatch(req.headers.get("X-Cron-Secret"), Deno.env.get("CRON_SHARED_SECRET"))) {
    return json({ error: "unauthorized" }, 401);
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const recipients = parseRecipients(Deno.env.get("LEAD_ALERT_TO"));
  const from = Deno.env.get("LEAD_ALERT_FROM");
  if (!resendKey || recipients.length === 0 || !from) {
    console.warn("[notify-access-request] alert not configured (RESEND_API_KEY/LEAD_ALERT_TO/LEAD_ALERT_FROM); skipped");
    return json({ skipped: "not_configured" });
  }

  let id: unknown;
  try {
    ({ id } = await req.json());
  } catch {
    return json({ error: "invalid_body" }, 400);
  }
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "invalid_id" }, 400);

  const { data, error } = await createSupabaseClient()
    .from("access_requests")
    .select("email, name, company, use_case, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[notify-access-request] lookup failed", error.code);
    return json({ error: "lookup_failed" }, 500);
  }
  if (!data) return json({ skipped: "not_found" });

  const email = buildLeadAlertEmail(data as LeadRow);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: recipients, reply_to: (data as LeadRow).email, ...email }),
  });
  if (!res.ok) {
    console.error("[notify-access-request] resend failed", res.status);
    return json({ error: "send_failed" }, 502);
  }
  return json({ sent: recipients.length });
});
