import { z } from 'zod';

export const ReceiptExtractionSchema = z.object({
  type: z.enum(['DEBIT', 'CREDIT']).nullable().optional(),
  title: z.string().trim().max(200).nullable().optional(),
  merchant: z.string().trim().max(200).nullable().optional(),
  amount: z.number().positive().nullable().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  currency: z.string().trim().toUpperCase().length(3).nullable().optional(),
  category: z.string().trim().max(120).nullable().optional(),
  paymentType: z.string().trim().max(100).nullable().optional(),
});

export type ReceiptExtraction = z.infer<typeof ReceiptExtractionSchema>;

export const InsightSchema = z.object({
  id: z.string().trim().min(1).max(60).describe('Short kebab-case identifier, e.g. "groceries-spend-up".'),
  title: z.string().trim().min(1).max(90),
  body: z.string().trim().min(1).max(420).describe('One or two sentences grounded in the provided aggregates.'),
  type: z.enum(['spend', 'income', 'subscription', 'budget', 'savings', 'info']),
  magnitude: z.enum(['low', 'medium', 'high']).describe('How notable this insight is for the user.'),
  amount: z.number().nonnegative().optional().describe('Associated amount in INR if the insight mentions one.'),
});

export const InsightsSchema = z.object({
  insights: z.array(InsightSchema).max(6),
});

export type Insight = z.infer<typeof InsightSchema>;
export type InsightsResult = z.infer<typeof InsightsSchema>;
