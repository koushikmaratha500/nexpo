import { z } from 'zod';

export const accountLifecycleOtpChannelSchema = z.enum(['email', 'sms']);

export type AccountLifecycleOtpChannel = z.infer<typeof accountLifecycleOtpChannelSchema>;

export const accountLifecycleOtpSendSchema = z.object({
  action: z.enum(['RESET', 'DELETE']),
  channel: accountLifecycleOtpChannelSchema,
});

export type AccountLifecycleOtpSendDto = z.infer<typeof accountLifecycleOtpSendSchema>;

export const accountLifecycleActionSchema = z.object({
  confirmation: z.enum(['RESET', 'DELETE']),
  channel: accountLifecycleOtpChannelSchema,
  otp: z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit code'),
});

export type AccountLifecycleActionDto = z.infer<typeof accountLifecycleActionSchema>;
