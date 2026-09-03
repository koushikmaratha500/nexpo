import { z } from 'zod';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './pagination.dto';

export const userReportQuerySchema = z.object({
  categoryId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.enum(['DEBIT', 'CREDIT', 'ALL']).default('DEBIT'),
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .transform((value) => Math.min(MAX_PAGE_SIZE, value))
    .default(DEFAULT_PAGE_SIZE),
});

export type UserReportQueryDto = z.infer<typeof userReportQuerySchema>;
