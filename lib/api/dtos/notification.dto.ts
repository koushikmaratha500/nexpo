import { z } from 'zod';
import { reminderChannelSchema } from './settings.dto';

export const notificationListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  unreadOnly: z
    .union([z.literal('true'), z.literal('false')])
    .transform((val) => val === 'true')
    .optional(),
});

export const updateNotificationPreferencesSchema = z.object({
  inAppEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  groupActivity: z.boolean().optional(),
});

export const registerPushSubscriptionSchema = z.object({
  playerId: z.string().trim().min(1, 'playerId is required'),
  platform: z.enum(['WEB', 'IOS', 'ANDROID']).default('WEB'),
});

export type UpdateNotificationPreferencesDto = z.infer<typeof updateNotificationPreferencesSchema>;
export type RegisterPushSubscriptionDto = z.infer<typeof registerPushSubscriptionSchema>;

export interface NotificationPreferencesResponse {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  groupActivity: boolean;
  adminPolicy: {
    inAppEnabled: boolean;
    emailEnabled: boolean;
    pushEnabled: boolean;
    resendEnabled: boolean;
  };
  allowedChannels: Array<z.infer<typeof reminderChannelSchema>>;
}
