import { z } from 'zod';

export const monthlyDigestDispatchSchema = z.object({
  period: z.union([z.literal('previous_month'), z.string().regex(/^\d{4}-\d{2}$/)]).default(
    'previous_month',
  ),
  mode: z.enum(['preview', 'test', 'production']).default('production'),
  testRecipient: z.string().email().optional(),
  userId: z.string().uuid().optional(),
});

export const monthlyDigestPreviewSchema = z.object({
  userId: z.string().uuid(),
  period: z.union([z.literal('previous_month'), z.string().regex(/^\d{4}-\d{2}$/)]).default(
    'previous_month',
  ),
});

export type MonthlyDigestDispatchDto = z.infer<typeof monthlyDigestDispatchSchema>;
export type MonthlyDigestPreviewDto = z.infer<typeof monthlyDigestPreviewSchema>;
