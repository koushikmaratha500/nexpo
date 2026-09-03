import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  code: z.string().min(1, 'System code is required').max(50),
  type: z.enum(['DEBIT', 'CREDIT']).default('CREDIT'),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  status: z.enum(['A', 'B', 'P', 'I']).default('A'),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100).optional(),
  code: z.string().min(1, 'System code is required').max(50).optional(),
  type: z.enum(['DEBIT', 'CREDIT']).optional(),
  color: z.string().nullish().optional(),
  icon: z.string().nullish().optional(),
  status: z.enum(['A', 'B', 'P', 'I']).optional(),
});

export const categoryListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(100),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
