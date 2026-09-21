// GHL/FastPayDirect order form URLs — one per plan/interval combo.
// Current approved public payment links are FastPayDirect links under links.darvisnutter.com.
// They are intentionally used as safe defaults so the app never falls back to REPLACE_* placeholders.

import { RPRX_FULL_IMPLEMENTATION_PAYMENT_URL, RPRX_MEMBERSHIP_PAYMENT_URL } from './rprxPaymentLinks';

export type PlanKey = 'partner' | 'pro';
export type IntervalKey = 'month' | 'year';

export const GHL_CHECKOUT_URLS: Record<PlanKey, Record<IntervalKey, string>> = {
  partner: {
    month: RPRX_MEMBERSHIP_PAYMENT_URL,
    year: RPRX_MEMBERSHIP_PAYMENT_URL,
  },
  pro: {
    month: RPRX_FULL_IMPLEMENTATION_PAYMENT_URL,
    year: RPRX_FULL_IMPLEMENTATION_PAYMENT_URL,
  },
};

// Public-facing funnel page for cold (logged-out) traffic. Affiliate ?ref= is appended automatically.
export const GHL_PUBLIC_FUNNEL_URL = RPRX_MEMBERSHIP_PAYMENT_URL;

export function buildCheckoutUrl(
  plan: PlanKey,
  interval: IntervalKey,
  opts: { email?: string | null; userId?: string | null; ref?: string | null } = {},
): string {
  const base = GHL_CHECKOUT_URLS[plan][interval];
  const url = new URL(base);
  if (opts.email)  url.searchParams.set('email', opts.email);
  if (opts.userId) url.searchParams.set('user_id', opts.userId);
  if (opts.ref)    url.searchParams.set('ref', opts.ref);
  return url.toString();
}

export function buildPublicFunnelUrl(ref?: string | null): string {
  const url = new URL(GHL_PUBLIC_FUNNEL_URL);
  if (ref) url.searchParams.set('ref', ref);
  return url.toString();
}
