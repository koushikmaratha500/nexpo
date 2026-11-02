import { z } from 'zod';
import { parsePaginationParams } from './pagination.dto';
import { resolveTransactionListDayBounds } from '@/lib/transactions/list-period-filter';

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
  startDay: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDayExclusive: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDay: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
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
    startDay: searchParams.get('startDay') || undefined,
    endDayExclusive: searchParams.get('endDayExclusive') || undefined,
    endDay: searchParams.get('endDay') || undefined,
    search: searchParams.get('search') || undefined,
    page: pagination.page,
    pageSize: pagination.pageSize,
  });

  const dayBounds = resolveTransactionListDayBounds(parsed);
  return {
    ...parsed,
    startDay: dayBounds.startDay ?? parsed.startDay,
    endDay: dayBounds.endDay ?? parsed.endDay,
  };
}
