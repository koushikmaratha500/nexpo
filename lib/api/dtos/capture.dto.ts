import { z } from 'zod';
import { createTransactionSchema } from './transaction.dto';

const fingerprint = z.string().regex(/^[a-f0-9]{64}$/, 'fingerprint must be a sha256 hex string');
const reference = z.string().trim().min(1).max(40).optional().nullable();

export const captureAssessSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1).max(200),
        source: z.enum(['sms', 'notification']),
        sender: z.string().max(200),
        text: z.string().min(1).max(1000),
        receivedAt: z.string().datetime({ offset: true }),
        local: z
          .object({
            kind: z.enum(['DEBIT', 'CREDIT']).optional(),
            amount: z.number().optional(),
            reference: z.string().max(40).optional(),
            merchant: z.string().max(200).optional(),
          })
          .optional(),
      }),
    )
    .min(1)
    .max(20),
});

export const captureRejectSchema = z.object({
  fingerprint,
  reference,
  decision: z.literal('REJECTED'),
});

export const captureSaveSchema = z.object({
  fingerprint,
  reference,
  transaction: createTransactionSchema,
});

export type CaptureAssessRequest = z.infer<typeof captureAssessSchema>;
export type CaptureRejectRequest = z.infer<typeof captureRejectSchema>;
export type CaptureSaveRequest = z.infer<typeof captureSaveSchema>;
