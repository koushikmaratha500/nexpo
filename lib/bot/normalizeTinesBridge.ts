import type { AiParseResult } from '@/lib/api/dtos/bot.dto';

export function parseJsonIfString(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return value;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
}

export function normalizeChannel(channel: unknown): 'whatsapp' | 'telegram' {
  if (typeof channel !== 'string') return 'whatsapp';
  const normalized = channel.trim().toLowerCase();
  return normalized === 'telegram' ? 'telegram' : 'whatsapp';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function extractAiParse(raw: Record<string, unknown>): Record<string, unknown> | null {
  const candidates = [
    raw.ai_parse,
    raw.aiParse,
    (raw.ai_parsing_agent as Record<string, unknown> | undefined)?.output,
    (raw.payload as Record<string, unknown> | undefined)?.ai_parse,
  ];

  for (const candidate of candidates) {
    const parsed = parseJsonIfString(candidate);
    if (isRecord(parsed) && typeof parsed.intent === 'string') {
      return parsed;
    }
  }

  const payload = parseJsonIfString(raw.payload);
  if (isRecord(payload) && typeof payload.intent === 'string') {
    return payload;
  }

  return null;
}

function extractWebhookData(raw: Record<string, unknown>) {
  const webhook = raw.ps_wa_webhook as Record<string, unknown> | undefined;
  const webhookBody = webhook?.body as Record<string, unknown> | undefined;
  const data = webhookBody?.data as Record<string, unknown> | undefined;

  return {
    event: webhookBody?.event,
    sessionId: webhookBody?.sessionId,
    idempotencyKey: webhookBody?.idempotencyKey,
    chatId: data?.chatId ?? data?.from,
    messageText: data?.body,
  };
}

export interface NormalizedTinesBridgeInput {
  channel: 'whatsapp' | 'telegram';
  event?: string;
  idempotency_key?: string;
  session_id?: string;
  external_user_id?: string;
  message_text?: string;
  user_id?: string;
  ai_parse: Record<string, unknown> | null;
}

export function normalizeTinesBridgeInput(raw: Record<string, unknown>): NormalizedTinesBridgeInput {
  const webhook = extractWebhookData(raw);

  const rawUserId = raw.user_id ?? raw.userId;
  const userId =
    typeof rawUserId === 'string' && isUuid(rawUserId)
      ? rawUserId
      : typeof rawUserId === 'string' && isUuid(rawUserId.trim())
        ? rawUserId.trim()
        : undefined;

  return {
    channel: normalizeChannel(raw.channel ?? raw.Channel ?? 'whatsapp'),
    event:
      (typeof raw.event === 'string' ? raw.event : undefined) ??
      (typeof webhook.event === 'string' ? webhook.event : undefined),
    idempotency_key:
      (typeof raw.idempotency_key === 'string' ? raw.idempotency_key : undefined) ??
      (typeof raw.idempotencyKey === 'string' ? raw.idempotencyKey : undefined) ??
      (typeof webhook.idempotencyKey === 'string' ? webhook.idempotencyKey : undefined),
    session_id:
      (typeof raw.session_id === 'string' ? raw.session_id : undefined) ??
      (typeof raw.sessionId === 'string' ? raw.sessionId : undefined) ??
      (typeof webhook.sessionId === 'string' ? webhook.sessionId : undefined),
    external_user_id:
      (typeof raw.external_user_id === 'string' ? raw.external_user_id : undefined) ??
      (typeof raw.externalUserId === 'string' ? raw.externalUserId : undefined) ??
      (typeof webhook.chatId === 'string' ? webhook.chatId : undefined),
    message_text:
      (typeof raw.message_text === 'string' ? raw.message_text : undefined) ??
      (typeof raw.messageText === 'string' ? raw.messageText : undefined) ??
      (typeof webhook.messageText === 'string' ? webhook.messageText : undefined),
    user_id: userId,
    ai_parse: extractAiParse(raw),
  };
}

export type { AiParseResult };
