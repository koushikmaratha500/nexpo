import { z } from 'zod';
import { normalizeChannel, parseJsonIfString } from '@/lib/bot/normalizeTinesBridge';

export const botChannelSchema = z.preprocess(
  (value) => normalizeChannel(value),
  z.enum(['whatsapp', 'telegram']),
);

export const botCommandNameSchema = z.enum([
  'CREATE_EXPENSE',
  'CREATE_INCOME',
  'GET_DAILY_SUMMARY',
  'GET_WEEKLY_SUMMARY',
  'GET_MONTHLY_SUMMARY',
  'GET_CATEGORY_SUMMARY',
  'GET_TRANSACTIONS',
  'DELETE_LAST_TRANSACTION',
  'UPDATE_LAST_TRANSACTION',
  'HELP',
]);

export const aiParseSchema = z.object({
  intent: z.string(),
  confidence: z.number().optional(),
  type: z.enum(['DEBIT', 'CREDIT']).nullable().optional(),
  amount: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  merchant: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  transaction_date: z.string().nullable().optional(),
  clarification_question: z.string().nullable().optional(),
  commands: z.array(z.record(z.unknown())).nullable().optional(),
  query: z
    .object({
      category: z.string().nullable().optional(),
      limit: z.number().nullable().optional(),
      period: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  update: z
    .object({
      amount: z.number().nullable().optional(),
      category: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export const botCommandPayloadSchema = z.object({
  amount: z.number().optional(),
  currency: z.string().optional(),
  category: z.string().optional(),
  categoryName: z.string().optional(),
  description: z.string().optional(),
  merchant: z.string().optional(),
  transaction_date: z.string().optional(),
  transactionDate: z.string().optional(),
  limit: z.number().optional(),
  period: z.string().optional(),
});

export const botCommandRequestSchema = z.object({
  command: botCommandNameSchema,
  user_id: z.string().uuid(),
  correlation_id: z.string().optional(),
  idempotency_key: z.string().min(1),
  source_channel: botChannelSchema,
  payload: botCommandPayloadSchema.optional().default({}),
});

export const resolveUserRequestSchema = z.object({
  channel: botChannelSchema,
  external_user_id: z.string().min(1),
});

const optionalUuid = z.preprocess((value) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)
    ? trimmed
    : undefined;
}, z.string().uuid().optional());

const optionalAiParse = z.preprocess((value) => {
  const parsed = parseJsonIfString(value);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  return undefined;
}, aiParseSchema.optional());

export const tinesBridgeRequestSchema = z.object({
  channel: botChannelSchema.default('whatsapp'),
  event: z.string().optional(),
  idempotency_key: z.string().optional(),
  session_id: z.string().optional(),
  external_user_id: z.string().optional(),
  message_text: z.string().optional(),
  user_id: optionalUuid,
  ai_parse: optionalAiParse,
});

export type BotCommandRequest = z.infer<typeof botCommandRequestSchema>;
export type AiParseResult = z.infer<typeof aiParseSchema>;
export type TinesBridgeRequest = z.infer<typeof tinesBridgeRequestSchema>;
export type ResolveUserRequest = z.infer<typeof resolveUserRequestSchema>;
