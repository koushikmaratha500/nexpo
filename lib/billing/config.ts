import type { PaymentProvider } from '@prisma/client';

export type CheckoutProviderSetting = 'razorpay' | 'stripe';

export function getBillingLegalName(): string {
  return process.env.BILLING_LEGAL_NAME?.trim() || 'PaysaSuchan (placeholder)';
}

export function getBillingAddress(): string {
  return process.env.BILLING_ADDRESS?.trim() || 'Address pending GST registration';
}

export function getBillingGstin(): string {
  return process.env.BILLING_GSTIN?.trim() || '29AAAAA0000A1Z5';
}

export function getBillingSac(): string {
  return process.env.BILLING_SAC?.trim() || '998314';
}

export function getBillingGstRate(): number {
  const raw = Number(process.env.BILLING_GST_RATE ?? 18);
  return Number.isFinite(raw) && raw >= 0 ? raw : 18;
}

export function getAppBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    'http://localhost:3000';
  return url.startsWith('http') ? url.replace(/\/$/, '') : `https://${url.replace(/\/$/, '')}`;
}

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim());
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function isProviderConfigured(provider: PaymentProvider): boolean {
  return provider === 'RAZORPAY' ? isRazorpayConfigured() : isStripeConfigured();
}

export function computeGstBreakdown(subtotalPaise: number) {
  const rate = getBillingGstRate();
  const gstPaise = Math.round((subtotalPaise * rate) / 100);
  const mode = (process.env.BILLING_GST_MODE ?? 'igst').toLowerCase();

  if (mode === 'intra') {
    const half = Math.round(gstPaise / 2);
    return {
      subtotalPaise,
      gstPaise,
      cgstPaise: half,
      sgstPaise: gstPaise - half,
      igstPaise: 0,
      totalPaise: subtotalPaise + gstPaise,
    };
  }

  return {
    subtotalPaise,
    gstPaise,
    cgstPaise: 0,
    sgstPaise: 0,
    igstPaise: gstPaise,
    totalPaise: subtotalPaise + gstPaise,
  };
}

export function inrToPaise(amountInr: number): number {
  return Math.round(amountInr * 100);
}

export function paiseToInr(paise: number): number {
  return paise / 100;
}

export function formatPaiseAsInr(paise: number): string {
  return `₹${paiseToInr(paise).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
