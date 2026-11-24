import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export class AiChatRepository {
  static findThreadById(id: string) {
    return prisma.aiChatThread.findUnique({ where: { id } });
  }

  static createThread(data: { id: string; userId: string; title: string }) {
    return prisma.aiChatThread.create({ data });
  }

  static listThreads(userId: string, take: number) {
    return prisma.aiChatThread.findMany({
      where: { userId },
      orderBy: { lastMessageAt: 'desc' },
      take,
      select: { id: true, title: true, lastMessageAt: true, createdAt: true },
    });
  }

  static deleteThread(id: string) {
    return prisma.aiChatThread.delete({ where: { id } });
  }

  static listMessages(threadId: string) {
    return prisma.aiChatMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true, parts: true },
    });
  }

  /** Appends a message and bumps the thread's ordering in one transaction. */
  static addMessage(data: { id: string; threadId: string; role: string; parts: Prisma.InputJsonValue }) {
    return prisma.$transaction([
      prisma.aiChatMessage.create({ data }),
      prisma.aiChatThread.update({
        where: { id: data.threadId },
        data: { lastMessageAt: new Date() },
      }),
    ]);
  }
}
