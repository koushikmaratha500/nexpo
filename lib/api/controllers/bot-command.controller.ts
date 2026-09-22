import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { botCommandRequestSchema } from '../dtos/bot.dto';
import { BotCommandService } from '../services/bot-command.service';

export class BotCommandController extends BaseController {
  static async execute(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const body = botCommandRequestSchema.parse(await req.json());
      const result = await BotCommandService.execute(body);
      return result;
    }, { fallbackMessage: 'Failed to execute bot command' });
  }
}
