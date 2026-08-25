import { z } from 'zod';
import { reminderChannelSchema } from './settings.dto';

export const reminderRecurrenceSchema = z.enum(['NONE', 'WEEKLY', 'MONTHLY']);
export const reminderStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'SNOOZED', 'CANCELLED']);

const channelsField = z
  .array(reminderChannelSchema)
  .min(1, 'At least one channel is required')
  .optional();

export const createReminderSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    amount: z.number().positive().optional(),
    dueDate: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
    recurrence: reminderRecurrenceSchema.default('NONE'),
    channels: channelsField,
    channel: reminderChannelSchema.optional(),
    notes: z.string().max(1000).optional().nullable(),
  })
  .transform((data) => ({
    ...data,
    channels: data.channels ?? (data.channel ? [data.channel] : ['IN_APP']),
  }));

export const updateReminderSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  amount: z.number().positive().optional().nullable(),
  dueDate: z
    .union([z.string(), z.date()])
    .transform((val) => new Date(val))
    .optional(),
  recurrence: reminderRecurrenceSchema.optional(),
  channels: channelsField,
  channel: reminderChannelSchema.optional(),
  status: reminderStatusSchema.optional(),
  snoozedUntil: z
    .union([z.string(), z.date()])
    .transform((val) => new Date(val))
    .optional()
    .nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const reminderListQuerySchema = z.object({
  from: z
    .union([z.string(), z.date()])
    .transform((val) => new Date(val))
    .optional(),
  to: z
    .union([z.string(), z.date()])
    .transform((val) => new Date(val))
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateReminderDto = z.infer<typeof createReminderSchema>;
export type UpdateReminderDto = z.infer<typeof updateReminderSchema>;
