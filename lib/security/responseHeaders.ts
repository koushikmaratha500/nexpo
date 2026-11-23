import { NextResponse } from 'next/server';

const BASELINE_CSP = [
  "default-src 'self'",
  // Razorpay Standard Checkout: checkout.js + its payment iframe (card data stays with Razorpay, PCI SAQ-A).
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://checkout.razorpay.com",
  // Google Fonts CSS (Material Symbols + legacy link tags in layout)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https:",
  "frame-src 'self' https://www.googletagmanager.com https://api.razorpay.com https://checkout.razorpay.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

export function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', BASELINE_CSP);
  return response;
}
