import { describe, expect, it } from 'vitest';
import { normalizeTinesBridgeInput } from '@/lib/bot/normalizeTinesBridge';

const sampleAiOutput = {
  intent: 'CREATE_EXPENSE',
  confidence: 0.94,
  type: 'DEBIT',
  amount: 750,
  currency: 'INR',
  merchant: 'Chandra mandalam restaurant',
  category: 'Food',
  description: 'Breakfast - Idly, Dosa',
  transaction_date: '2026-09-18',
  clarification_question: null,
  commands: null,
  query: null,
  update: null,
};

describe('normalizeTinesBridgeInput', () => {
  it('extracts fields from flat body', () => {
    const result = normalizeTinesBridgeInput({
      channel: 'whatsapp',
      external_user_id: '201137630216422@lid',
      idempotency_key: 'msg-1',
      ai_parse: sampleAiOutput,
    });

    expect(result.channel).toBe('whatsapp');
    expect(result.external_user_id).toBe('201137630216422@lid');
    expect(result.ai_parse?.intent).toBe('CREATE_EXPENSE');
  });

  it('normalizes Whatsapp channel casing', () => {
    const result = normalizeTinesBridgeInput({
      channel: 'Whatsapp',
      ai_parse: sampleAiOutput,
    });

    expect(result.channel).toBe('whatsapp');
  });

  it('parses ai_parse when sent as JSON string', () => {
    const result = normalizeTinesBridgeInput({
      channel: 'whatsapp',
      ai_parse: JSON.stringify(sampleAiOutput),
    });

    expect(result.ai_parse?.amount).toBe(750);
  });

  it('extracts ai_parse from ai_parsing_agent.output', () => {
    const result = normalizeTinesBridgeInput({
      ai_parsing_agent: { output: sampleAiOutput },
      ps_wa_webhook: {
        body: {
          data: { chatId: '201137630216422@lid', body: 'test message' },
          idempotencyKey: 'msg-2',
        },
      },
    });

    expect(result.ai_parse?.intent).toBe('CREATE_EXPENSE');
    expect(result.external_user_id).toBe('201137630216422@lid');
    expect(result.idempotency_key).toBe('msg-2');
    expect(result.message_text).toBe('test message');
  });

  it('ignores invalid user_id (e.g. date object stringified)', () => {
    const result = normalizeTinesBridgeInput({
      user_id: '{"iso8601":"2026-09-18T00:00:00+05:30"}',
      ai_parse: sampleAiOutput,
    });

    expect(result.user_id).toBeUndefined();
  });

  it('keeps valid user_id uuid', () => {
    const uuid = '11111111-1111-1111-1111-111111111111';
    const result = normalizeTinesBridgeInput({
      user_id: uuid,
      ai_parse: sampleAiOutput,
    });

    expect(result.user_id).toBe(uuid);
  });
});
