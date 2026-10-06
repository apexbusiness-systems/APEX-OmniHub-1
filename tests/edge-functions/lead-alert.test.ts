import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildLeadAlertEmail,
  escapeHtml,
  parseRecipients,
  secretsMatch,
} from '../../supabase/functions/notify-access-request/leadAlert';

// APEX-REV-2026-09 WP-05 (F-10): new-lead alert via the existing Resend channel.
const LEAD = {
  email: 'lead@example.com',
  name: '<script>x</script>',
  company: null,
  use_case: '[design-sprint] automate intake',
  created_at: '2026-09-28T00:00:00Z',
};

describe('lead alert helpers', () => {
  it('escapes HTML so lead input cannot inject markup', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
    const email = buildLeadAlertEmail(LEAD);
    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;script&gt;');
  });

  it('flags Design Sprint leads in the subject and shows empty fields as a dash', () => {
    const email = buildLeadAlertEmail(LEAD);
    expect(email.subject.startsWith('Design Sprint lead:')).toBe(true);
    expect(email.text).toContain('Company: —');
  });

  it('parses and de-duplicates recipients, dropping invalid entries', () => {
    expect(parseRecipients(' a@x.io, bad, a@x.io ,b@y.co ')).toEqual(['a@x.io', 'b@y.co']);
    expect(parseRecipients(undefined)).toEqual([]);
  });

  it('compares the cron secret safely and fails closed', () => {
    expect(secretsMatch('s3cret', 's3cret')).toBe(true);
    expect(secretsMatch('s3creT', 's3cret')).toBe(false);
    expect(secretsMatch(null, 's3cret')).toBe(false);
    expect(secretsMatch('s3cret', undefined)).toBe(false);
  });
});

describe('lead alert migration', () => {
  const sql = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/20260928010000_access_requests_lead_alert.sql'),
    'utf8'
  );

  it('never blocks the lead insert and is locked down', () => {
    expect(sql).toMatch(/SECURITY DEFINER\s+SET search_path = ''/);
    expect(sql).toMatch(/EXCEPTION WHEN OTHERS THEN/);
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.notify_access_request\(\) FROM PUBLIC, anon, authenticated/);
    expect(sql).toMatch(/AFTER INSERT ON public\.access_requests/);
  });

  it('re-creates its trigger idempotently with the additive-allow annotation', () => {
    expect(sql).toMatch(/-- additive-allow: DROP_TRIGGER .+\nDROP TRIGGER IF EXISTS access_requests_lead_alert_trigger/);
  });
});
