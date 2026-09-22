import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { assertBotCommandAuthorized } from '@/lib/api/utils/botCommandAuth';
import { BotCommandController } from '@/lib/api/controllers/bot-command.controller';

export async function POST(req: NextRequest) {
  try {
    assertBotCommandAuthorized(req);
    return await BotCommandController.execute(req);
  } catch (error) {
    return handleApiError(error);
  }
}
