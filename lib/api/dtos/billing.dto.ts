import { z } from 'zod';

export const createCheckoutSchema = z.object({
  sku: z.enum(['STARTER_MONTHLY', 'STARTER_YEARLY', 'PRO_LIFETIME']),
});

export const verifyRazorpaySchema = z.object({
  checkoutSessionId: z.string().uuid(),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
  razorpayOrderId: z.string().optional(),
  razorpaySubscriptionId: z.string().optional(),
});

export const updateBillingProfileSchema = z.object({
  billingGstin: z.string().trim().max(15).nullable().optional(),
});

export type CreateCheckoutDto = z.infer<typeof createCheckoutSchema>;
export type VerifyRazorpayDto = z.infer<typeof verifyRazorpaySchema>;
export type UpdateBillingProfileDto = z.infer<typeof updateBillingProfileSchema>;
