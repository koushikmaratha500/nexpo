import { z } from 'zod';
import { isValidUsername } from '../utils/username';

export const usernameFieldSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .refine((value) => isValidUsername(value), {
    message: 'Username must use letters, numbers, or underscores only',
  });

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(80, 'Group name is too long'),
  description: z.string().trim().max(500, 'Description is too long').optional().nullable(),
});

export const updateGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(80, 'Group name is too long').optional(),
  description: z.string().trim().max(500, 'Description is too long').optional().nullable(),
});

export const inviteGroupMemberSchema = z
  .object({
    username: usernameFieldSchema.optional(),
    email: z.string().email('Provide a valid email address').optional(),
    phone: z.string().trim().min(6, 'Phone number is too short').max(20, 'Phone number is too long').optional(),
  })
  .refine((data) => Boolean(data.username || data.email || data.phone), {
    message: 'Provide a username, email, or phone number to invite',
  });

export const groupListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateGroupDto = z.infer<typeof createGroupSchema>;
export type UpdateGroupDto = z.infer<typeof updateGroupSchema>;
export type InviteGroupMemberDto = z.infer<typeof inviteGroupMemberSchema>;
