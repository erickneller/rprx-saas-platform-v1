import { RPRX_MEMBERSHIP_PAYMENT_URL } from '@/lib/rprxPaymentLinks';

// RPRx W2 public campaign currently uses the approved $97/mo membership checkout.
// Do not reintroduce placeholder Stripe links.
export const CHECKOUT_MONTHLY_URL = RPRX_MEMBERSHIP_PAYMENT_URL;
export const CHECKOUT_ANNUAL_URL = RPRX_MEMBERSHIP_PAYMENT_URL;
export const MEMBER_LOGIN_URL = "/auth";
