import { z } from 'zod';

export const convertTransactionSchema = z
  .object({
    target: z.enum(['personal', 'group']),
    groupId: z.string().uuid().optional(),
  })
  .refine((data) => data.target !== 'group' || data.groupId, {
    message: 'groupId is required when converting to a group transaction',
  });

export type ConvertTransactionDto = z.infer<typeof convertTransactionSchema>;
