import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { assertBotCommandAuthorized } from '@/lib/api/utils/botCommandAuth';
import { ChannelAccountController } from '@/lib/api/controllers/channel-account.controller';

export async function POST(req: NextRequest) {
  try {
    assertBotCommandAuthorized(req);
    return await ChannelAccountController.resolveUser(req);
  } catch (error) {
    return handleApiError(error);
  }
}
