import { BaseController } from './base.controller';
import { AiChatService } from '../services/ai-chat.service';
import { chatThreadIdSchema } from '../dtos/ai-chat.dto';

export class AiChatController extends BaseController {
  static async list(userId: string) {
    return this.safeExecuteJson(async () => ({ threads: await AiChatService.listThreads(userId) }), {
      fallbackMessage: 'Failed to load chats',
    });
  }

  static async get(userId: string, threadId: string) {
    return this.safeExecuteJson(
      async () => AiChatService.getThread(userId, chatThreadIdSchema.parse(threadId)),
      { fallbackMessage: 'Failed to load chat' },
    );
  }

  static async remove(userId: string, threadId: string) {
    return this.safeExecuteJson(
      async () => AiChatService.deleteThread(userId, chatThreadIdSchema.parse(threadId)),
      { fallbackMessage: 'Failed to delete chat' },
    );
  }
}
