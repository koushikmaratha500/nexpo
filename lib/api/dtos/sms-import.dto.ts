import { z } from 'zod';

export const smsMessageInputSchema = z.object({
  external_sms_id: z.string().optional(),
  sender: z.string().min(1),
  body: z.string().min(1),
  received_at: z.string().min(1),
  message_hash: z.string().optional(),
});

export const smsSyncRequestSchema = z.object({
  device_id: z.string().min(1),
  messages: z.array(smsMessageInputSchema).min(1).max(50),
});

export const smsManualImportSchema = z.object({
  device_id: z.string().min(1).optional(),
  sender: z.string().optional(),
  body: z.string().min(1),
  received_at: z.string().optional(),
});

export const smsSettingsUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  notify_on_sync: z.boolean().optional(),
  android_sms_granted: z.boolean().optional(),
  notifications_granted: z.boolean().optional(),
  call_granted: z.boolean().optional(),
  location_granted: z.boolean().optional(),
});

export type SmsMessageInput = z.infer<typeof smsMessageInputSchema>;
export type SmsSyncRequest = z.infer<typeof smsSyncRequestSchema>;
export type SmsManualImportRequest = z.infer<typeof smsManualImportSchema>;
export type SmsSettingsUpdate = z.infer<typeof smsSettingsUpdateSchema>;
