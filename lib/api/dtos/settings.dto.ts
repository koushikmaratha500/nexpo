import { z } from 'zod';

export const reminderChannelSchema = z.enum(['IN_APP', 'EMAIL', 'PUSH', 'WHATSAPP']);

export const notificationSettingsSchema = z.object({
  pushEnabled: z.boolean().optional(),
  emailRemindersEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  defaultChannels: z.array(reminderChannelSchema).min(1).optional(),
});

export const updateSystemSettingsSchema = z.object({
  baseCurrency: z.string().trim().length(3, 'Currency code must be 3 letters').optional(),
  matchingRate: z.number().int().min(50).max(100).optional(),
  requireReceipt: z.boolean().optional(),
  autoApproveLimit: z.number().min(0).optional(),
  notifications: notificationSettingsSchema.optional(),
});

export type UpdateSystemSettingsDto = z.infer<typeof updateSystemSettingsSchema>;

export interface SystemSettingsResponse {
  baseCurrency: string;
  matchingRate: number;
  requireReceipt: boolean;
  autoApproveLimit: number;
  notifications: {
    pushEnabled: boolean;
    emailRemindersEnabled: boolean;
    inAppEnabled: boolean;
    defaultChannels: Array<'IN_APP' | 'EMAIL' | 'PUSH' | 'WHATSAPP'>;
  };
  resendEnabled: boolean;
}
