import { z } from 'zod';
import { reminderStatusSchema } from './reminder.dto';

export const adminReminderListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  scope: z.enum(['ALL', 'PERSONAL', 'GROUP']).default('ALL'),
  status: reminderStatusSchema.optional(),
  search: z.string().trim().optional(),
});

export type AdminReminderListQueryDto = z.infer<typeof adminReminderListQuerySchema>;
