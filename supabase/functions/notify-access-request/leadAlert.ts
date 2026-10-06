/**
 * Pure helpers for the new-lead alert (APEX-REV-2026-09 WP-05 F-10).
 * Zero imports so both Deno and Vitest can load this module.
 */

export interface LeadRow {
  email: string;
  name: string;
  company: string | null;
  use_case: string | null;
  created_at: string;
}

export interface LeadAlertEmail {
  subject: string;
  html: string;
  text: string;
}

const HTML_ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

/** Comma-separated LEAD_ALERT_TO → valid, de-duplicated addresses. */
export function parseRecipients(raw: string | undefined): string[] {
  if (!raw) return [];
  const valid = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
  return [...new Set(valid)];
}

/** Constant-time comparison; false when either side is empty. */
export function secretsMatch(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected || provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export function buildLeadAlertEmail(lead: LeadRow): LeadAlertEmail {
  const isSprint = (lead.use_case ?? '').startsWith('[design-sprint]');
  const subject = `${isSprint ? 'Design Sprint lead' : 'New access request'}: ${lead.name}`.slice(0, 150);
  const rows: Array<[string, string]> = [
    ['Name', lead.name],
    ['Email', lead.email],
    ['Company', lead.company ?? '—'],
    ['Use case', lead.use_case ?? '—'],
    ['Received', lead.created_at],
  ];
  const html =
    '<table cellpadding="6">' +
    rows.map(([k, v]) => `<tr><th align="left">${k}</th><td>${escapeHtml(v)}</td></tr>`).join('') +
    '</table>';
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
  return { subject, html, text };
}
