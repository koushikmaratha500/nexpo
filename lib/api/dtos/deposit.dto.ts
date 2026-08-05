import { z } from 'zod';

export const createDepositSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters'),
  amount: z.number().positive('Amount must be a positive number'),
  currencyId: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  budgetDepositTypeId: z.string().optional().nullable(),
  budgetDepositType: z.string().optional().nullable(),
  paymentTypeId: z.string().optional().nullable(),
  paymentType: z.string().optional().nullable(),
  budgetTypeId: z.string().optional().nullable(),
  budgetType: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  date: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional().nullable(),
  documentUrl: z.string().optional().nullable(),
  documentFileName: z.string().optional().nullable(),
  documentMimeType: z.string().optional().nullable(),
  documentSize: z.number().optional().nullable(),
});

export const updateDepositSchema = createDepositSchema.partial();
