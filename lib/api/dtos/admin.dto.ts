import { z } from 'zod';

export const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().nullable().optional(),
  email: z.string().email('Provide a valid email address'),
  password: z.string().min(7, 'Password must be at least 7 characters long'),
  mobile: z.string().nullable().optional(),
  countryId: z.string().uuid('Invalid Country ID format').nullable().optional(),
  currencyId: z.string().uuid('Invalid Currency ID format').nullable().optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.partial().extend({
  password: z.string().min(7, 'Password must be at least 7 characters long').optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export const createAdminSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().nullable().optional(),
  email: z.string().email('Provide a valid email address'),
  password: z.string().min(7, 'Password must be at least 7 characters long'),
});

export type CreateAdminDto = z.infer<typeof createAdminSchema>;

export const updateAdminSchema = createAdminSchema.partial().extend({
  password: z.string().min(7, 'Password must be at least 7 characters long').optional(),
});

export type UpdateAdminDto = z.infer<typeof updateAdminSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(1).max(200).optional().default(20),
});
