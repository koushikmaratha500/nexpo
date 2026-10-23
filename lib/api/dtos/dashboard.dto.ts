import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'month must be YYYY-MM')
    .optional(),
});

export type DashboardQueryDto = z.infer<typeof dashboardQuerySchema>;
