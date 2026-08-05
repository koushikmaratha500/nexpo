import { z } from 'zod';

const expenseBaseObject = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters').optional().nullable(),
  merchant: z.string().min(1, 'Merchant is required').max(100, 'Merchant must be at most 100 characters').optional().nullable(),
  description: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  currencyId: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  paymentTypeId: z.string().optional().nullable(),
  paymentType: z.string().optional().nullable(),
  amount: z.number().positive('Amount must be a positive number'),
  expenseDate: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
  receiptFileName: z.string().optional().nullable(),
  receiptMimeType: z.string().optional().nullable(),
  receiptSize: z.number().optional().nullable(),
});

export const createExpenseSchema = expenseBaseObject.refine((data) => data.title || data.merchant, {
  message: 'Either title or merchant is required',
  path: ['title'],
});

export const updateExpenseSchema = expenseBaseObject.partial();
