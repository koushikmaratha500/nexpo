import { z } from 'zod';
import { createTransactionSchema, updateTransactionSchema } from './transaction.dto';

export const splitParticipantSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  included: z.boolean().default(true),
  shareAmount: z.number().nonnegative().optional(),
  sharePercent: z.number().nonnegative().max(100).optional(),
});

export const splitSchema = z.object({
  mode: z.enum(['EQUAL_INCLUDED', 'CUSTOM_AMOUNT', 'CUSTOM_PERCENT']),
  participants: z.array(splitParticipantSchema).min(1, 'At least one participant is required'),
});

export const createGroupTransactionSchema = createTransactionSchema.and(
  z.object({
    split: splitSchema,
  }),
);

export const updateGroupTransactionSchema = updateTransactionSchema.and(
  z.object({
    split: splitSchema.optional(),
  }),
);

export const groupTransactionListQuerySchema = z.object({
  type: z.enum(['DEBIT', 'CREDIT']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateGroupTransactionDto = z.infer<typeof createGroupTransactionSchema>;
export type UpdateGroupTransactionDto = z.infer<typeof updateGroupTransactionSchema>;
