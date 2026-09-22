import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { resolveUserRequestSchema } from '../dtos/bot.dto';
import { ChannelAccountService } from '../services/channel-account.service';

export class ChannelAccountController extends BaseController {
  static async resolveUser(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const body = resolveUserRequestSchema.parse(await req.json());
      return ChannelAccountService.resolveUser(body);
    }, { fallbackMessage: 'Failed to resolve user' });
  }
}
