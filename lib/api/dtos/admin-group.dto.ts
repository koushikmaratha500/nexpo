import { z } from 'zod';

export const adminGroupListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
});

export type AdminGroupListQueryDto = z.infer<typeof adminGroupListQuerySchema>;
