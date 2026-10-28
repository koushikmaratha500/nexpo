import { z } from 'zod';
import { parsePaginationParams } from './pagination.dto';

export const transactionListQuerySchema = z.object({
  type: z.enum(['DEBIT', 'CREDIT']).optional(),
  categoryId: z.string().optional(),
  category: z.string().optional(),
  startDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  endDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  endExclusive: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export function parseTransactionListQuery(searchParams: URLSearchParams) {
  const pagination = parsePaginationParams(searchParams);
  const parsed = transactionListQuerySchema.parse({
    type: searchParams.get('type') || undefined,
    categoryId: searchParams.get('categoryId') || undefined,
    category: searchParams.get('category') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    endExclusive: searchParams.get('endExclusive') || undefined,
    search: searchParams.get('search') || undefined,
    page: pagination.page,
    pageSize: pagination.pageSize,
  });
  return parsed;
}
