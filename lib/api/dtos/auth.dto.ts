import { z } from 'zod';
import { usernameFieldSchema } from './group.dto';

export const loginSchema = z.object({
  email: z.string().email('Provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const registerSchema = z.object({
  username: usernameFieldSchema,
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().optional(),
  email: z.string().email('Provide a valid email address'),
  password: z.string().min(7, 'Password must be at least 7 characters long'),
  country: z.string().min(1, 'Country selection is required'),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Provide a valid email address'),
  otp: z.string().min(4, 'OTP must be at least 4 digits').max(8, 'OTP is too long'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Provide a valid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Reset token is invalid'),
  password: z.string().min(7, 'Password must be at least 7 characters long'),
});

export const updateProfileSchema = z.object({
  username: usernameFieldSchema.optional(),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long').optional(),
  lastName: z.string().optional(),
  mobile: z.string().optional(),
  profileImageUrl: z.string().url('Invalid URL format').optional().nullable(),
  countryId: z.string().uuid('Invalid Country ID format').optional(),
  currencyId: z.string().uuid('Invalid Currency ID format').optional(),
  oldPassword: z.string().optional(),
  newPassword: z.string().min(7, 'New password must be at least 7 characters long').optional(),
});

export const completeForcedResetSchema = z.object({
  newPassword: z.string().min(7, 'New password must be at least 7 characters long'),
});

export const googleAuthSchema = z.object({
  accessToken: z.string().min(20, 'Access token is required'),
});
