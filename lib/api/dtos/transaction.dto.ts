import { z } from 'zod';
import { normalizeTransactionDateForStorage } from '@/lib/transactions/transaction-date';

/** FormData and JSON often send ""; treat as omitted for optional text fields. */
function emptyToUndefined(val: unknown): unknown {
  if (val === '' || val === null) return undefined;
  if (typeof val === 'string' && val.trim() === '') return undefined;
  return val;
}

/** True for "" (clears the document) or a public URL in our Supabase storage. */
export function isStoredDocumentUrl(value: string): boolean {
  if (value === '') return true;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, '');
  if (!supabaseUrl) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && value.startsWith(`${supabaseUrl}/storage/v1/object/`);
  } catch {
    return false;
  }
}

const optionalTitleField = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be at most 100 characters')
    .optional()
    .nullable(),
);

const optionalMerchantField = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .min(1, 'Merchant must not be empty when provided')
    .max(100, 'Merchant must be at most 100 characters')
    .optional()
    .nullable(),
);

const transactionBaseObject = z.object({
  type: z.enum(['DEBIT', 'CREDIT']),
  title: optionalTitleField,
  merchant: optionalMerchantField,
  description: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  currencyId: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  paymentTypeId: z.string().optional().nullable(),
  paymentType: z.string().optional().nullable(),
  budgetDepositTypeId: z.string().optional().nullable(),
  budgetDepositType: z.string().optional().nullable(),
  budgetTypeId: z.string().optional().nullable(),
  budgetType: z.string().optional().nullable(),
  amount: z.number().positive('Amount must be a positive number'),
  transactionDate: z
    .union([z.string(), z.date()])
    .transform((val) => normalizeTransactionDateForStorage(val)),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional().nullable(),
  // Only URLs from our own storage: any other value (e.g. javascript:) is opened by the admin UI.
  documentUrl: z
    .string()
    .refine(isStoredDocumentUrl, 'Document URL must come from an upload')
    .optional()
    .nullable(),
  documentFileName: z.string().optional().nullable(),
  documentMimeType: z.string().optional().nullable(),
  documentSize: z.number().optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurringDay: z.number().int('Recurring day must be a whole number').min(1, 'Recurring day must be between 1 and 31').max(31, 'Recurring day must be between 1 and 31').optional().nullable(),
});

export const createTransactionSchema = transactionBaseObject.refine((data) => data.title || data.merchant, {
  message: 'Either title or merchant is required',
  path: ['title'],
}).refine((data) => !data.isRecurring || (data.recurringDay != null && data.recurringDay >= 1 && data.recurringDay <= 31), {
  message: 'Recurring day of the month (1-31) is required when Recurring is enabled',
  path: ['recurringDay'],
});

export const updateTransactionSchema = transactionBaseObject
  .partial()
  .refine(
    (data) => {
      const hasTitle = data.title != null && String(data.title).trim().length > 0;
      const hasMerchant = data.merchant != null && String(data.merchant).trim().length > 0;
      if (data.title === undefined && data.merchant === undefined) return true;
      return hasTitle || hasMerchant;
    },
    {
      message: 'Either title or merchant is required',
      path: ['title'],
    },
  )
  .refine(
    (data) => !data.isRecurring || (data.isRecurring && data.recurringDay != null),
    {
      message: 'Recurring day of the month (1-31) is required when Recurring is enabled',
      path: ['recurringDay'],
    },
  );

export const approveRecurringSchema = z.object({
  items: z
    .array(
      z.object({
        transactionId: z.string().min(1, 'transactionId is required'),
        dueDate: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
      })
    )
    .min(1, 'At least one recurring transaction must be selected'),
});

export const importTransactionSchema = z.object({
  rows: z.array(
    transactionBaseObject
      .extend({
        lineNumber: z.number().int().positive().optional(),
      })
      .refine((data) => data.title || data.merchant, {
        message: 'Either title or merchant is required',
        path: ['title'],
      })
      .refine((data) => !data.isRecurring || (data.recurringDay != null && data.recurringDay >= 1 && data.recurringDay <= 31), {
        message: 'Recurring day of the month (1-31) is required when Recurring is enabled',
        path: ['recurringDay'],
      })
  ),
});

export type CreateTransactionData = z.infer<typeof createTransactionSchema>;
export type ApproveRecurringData = z.infer<typeof approveRecurringSchema>;
export type ImportTransactionData = z.infer<typeof importTransactionSchema>;