-- Refund tracking on billing payments (additive, safe on existing rows).
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_REFUNDED';
ALTER TABLE "BillingPayment" ADD COLUMN IF NOT EXISTS "refundedPaise" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "BillingPayment" ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3);
