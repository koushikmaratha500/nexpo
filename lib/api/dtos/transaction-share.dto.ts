import { z } from 'zod';

export const createTransactionShareSchema = z.object({
  expiresInDays: z.coerce.number().int().min(1).max(30).optional().default(7),
});

export type CreateTransactionShareDto = z.infer<typeof createTransactionShareSchema>;
