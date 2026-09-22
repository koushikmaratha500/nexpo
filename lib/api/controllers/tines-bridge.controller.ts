import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { aiParseSchema } from '../dtos/bot.dto';
import { ChannelAccountService } from '../services/channel-account.service';
import { BotCommandService } from '../services/bot-command.service';
import { formatBotReply } from '@/lib/bot/formatReply';
import { normalizeTinesBridgeInput } from '@/lib/bot/normalizeTinesBridge';

export class TinesBridgeController extends BaseController {
  static async ingest(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const raw = (await req.json()) as Record<string, unknown>;
      const normalized = normalizeTinesBridgeInput(raw);

      const channel = normalized.channel;
      const externalUserId = normalized.external_user_id;
      const idempotencyKey = normalized.idempotency_key || `bridge:${Date.now()}`;

      const aiParseRaw = normalized.ai_parse;
      const aiParse = aiParseRaw ? aiParseSchema.safeParse(aiParseRaw) : null;

      if (!aiParse?.success) {
        return {
          ok: true,
          success: false,
          error_code: 'MISSING_AI_PARSE',
          reply_text: 'Message received but AI parse result is missing or invalid.',
          channel,
          idempotency_key: idempotencyKey,
          ...(aiParse && !aiParse.success
            ? { validation_error: aiParse.error.issues[0]?.message }
            : {}),
        };
      }

      if (!externalUserId) {
        return {
          ok: true,
          success: false,
          error_code: 'MISSING_EXTERNAL_USER',
          reply_text: 'Could not identify your WhatsApp account.',
          channel,
          idempotency_key: idempotencyKey,
        };
      }

      const userId = await ChannelAccountService.resolveUserId(
        channel,
        externalUserId,
        normalized.user_id,
      );

      if (!userId) {
        const result = {
          success: false,
          error_code: 'USER_NOT_LINKED',
          message:
            'Your WhatsApp is not linked to PaySaSuchan. Open the app → Settings → Link WhatsApp.',
        };
        return {
          ok: true,
          ...result,
          reply_text: formatBotReply(result),
          channel,
          idempotency_key: idempotencyKey,
        };
      }

      const commandResult = await BotCommandService.executeFromAiParse({
        userId,
        channel,
        idempotencyKey,
        aiParse: aiParse.data,
      });

      return {
        ok: true,
        success: commandResult.success,
        channel,
        idempotency_key: idempotencyKey,
        intent: aiParse.data.intent,
        transaction_id: commandResult.transaction_id,
        error_code: commandResult.error_code,
        display: commandResult.display,
        reply_text: formatBotReply(commandResult),
      };
    }, { fallbackMessage: 'Failed to process Tines bridge request' });
  }
}
