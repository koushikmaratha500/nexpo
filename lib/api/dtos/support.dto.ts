import { z } from 'zod';

export const createSupportTicketSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  email: z.string().email('Provide a valid email address'),
  phone: z.string().optional().nullable(),
  message: z.string().min(1, 'Message is required').max(2000, 'Message is too long'),
  fileUrl: z.string().url('Invalid file URL format').optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB').optional().nullable(),
});

export const updateSupportTicketSchema = z.object({
  adminNotes: z.string().max(2000, 'Admin notes are too long').optional().nullable(),
  status: z.enum(['A', 'D', 'B', 'I', 'P']).optional(),
});
