/**
 * tests/unit/apexAppsResolve.test.ts
 *
 * Dedicated test suite for apexAppsResolve — prompt-first APEX ecosystem app resolution.
 * OWNED BY: APEX Business Systems Ltd.
 */
import { describe, it, expect } from 'vitest';
import { resolveApexApp } from '../../apps/omnihub-site/dashboard/components/modules/apexAppsResolve';

describe('apexAppsResolve — deterministic resolution', () => {
  it('resolves exact match by ID', () => {
    expect(resolveApexApp('dueradar')?.id).toBe('dueradar');
    expect(resolveApexApp('aspiral')?.id).toBe('aspiral');
    expect(resolveApexApp('flowbills')?.id).toBe('flowbills');
    expect(resolveApexApp('armageddon')?.id).toBe('armageddon');
    expect(resolveApexApp('thelampstand')?.id).toBe('thelampstand');
    expect(resolveApexApp('cheapstays')?.id).toBe('cheapstays');
    expect(resolveApexApp('sbbl-hq')?.id).toBe('sbbl-hq');
    expect(resolveApexApp('jubeelove')?.id).toBe('jubeelove');
    expect(resolveApexApp('playmoney')?.id).toBe('playmoney');
  });

  it('resolves case-insensitively and handles surrounding whitespace', () => {
    expect(resolveApexApp('  DueRadar  ')?.id).toBe('dueradar');
    expect(resolveApexApp('ASPIRAL')?.id).toBe('aspiral');
    expect(resolveApexApp('Jubee Love')?.id).toBe('jubeelove');
    expect(resolveApexApp('Armageddon Test Suite')?.id).toBe('armageddon');
  });

  it('resolves conversational / natural-language prompts with substring matches', () => {
    expect(resolveApexApp('please connect my DueRadar account')?.id).toBe('dueradar');
    expect(resolveApexApp('integrate with thelampstand')?.id).toBe('thelampstand');
    expect(resolveApexApp('launch aSpiral workspace')?.id).toBe('aspiral');
    expect(resolveApexApp('check cheapstays booking engine')?.id).toBe('cheapstays');
  });

  it('resolves apps via canonical domain or full URL', () => {
    expect(resolveApexApp('flowbills.ca')?.id).toBe('flowbills');
    expect(resolveApexApp('https://flowbills.ca')?.url).toBe('https://flowbills.ca');
    expect(resolveApexApp('https://jubee.love')?.id).toBe('jubeelove');
    expect(resolveApexApp('https://armageddontest.icu')?.id).toBe('armageddon');
    expect(resolveApexApp('aspiral.icu')?.id).toBe('aspiral');
  });

  it('resolves spaced and punctuated aliases', () => {
    expect(resolveApexApp('flow bills')?.id).toBe('flowbills');
    expect(resolveApexApp('cheap stays')?.id).toBe('cheapstays');
    expect(resolveApexApp('play money')?.id).toBe('playmoney');
    expect(resolveApexApp('sbbl hq')?.id).toBe('sbbl-hq');
    expect(resolveApexApp('jubee-love')?.id).toBe('jubeelove');
  });

  it('returns null for empty, whitespace-only, or punctuation-only strings', () => {
    expect(resolveApexApp('')).toBeNull();
    expect(resolveApexApp('   ')).toBeNull();
    expect(resolveApexApp('---')).toBeNull();
    expect(resolveApexApp('!@#$%^&*()')).toBeNull();
  });

  it('returns null for unknown SaaS providers to enforce honest surface gating', () => {
    expect(resolveApexApp('salesforce')).toBeNull();
    expect(resolveApexApp('stripe')).toBeNull();
    expect(resolveApexApp('hubspot')).toBeNull();
    expect(resolveApexApp('random external tool')).toBeNull();
  });
});
