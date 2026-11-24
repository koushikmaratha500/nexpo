import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { AiChatService } from '../services/ai-chat.service';
import { chatThreadIdSchema } from '../dtos/ai-chat.dto';
import { z } from 'zod';

const userIdSchema = z.string().uuid('Invalid user id');

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

  static async adminList(userId: string) {
    return this.safeExecuteJson(
      async () => ({ threads: await AiChatService.listThreadsForAdmin(userIdSchema.parse(userId)) }),
      { fallbackMessage: 'Failed to load chats' },
    );
  }

  static async adminGet(req: NextRequest, adminId: string, userId: string, threadId: string) {
    return this.safeExecuteJson(
      async () =>
        AiChatService.getThreadForAdmin(
          adminId,
          userIdSchema.parse(userId),
          chatThreadIdSchema.parse(threadId),
          this.requestMeta(req),
        ),
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
