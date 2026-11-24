import { randomUUID } from 'crypto';
import type { Prisma } from '@prisma/client';
import type { UIMessage } from 'ai';
import { HttpError } from '../middleware/errorHandler';
import { AiChatRepository } from '../repositories/ai-chat.repository';
import { MAX_CHAT_MESSAGE_CHARS } from '../dtos/ai-chat.dto';

const THREAD_TITLE_CHARS = 60;
// shortcut: newest 100 threads, no paging; add cursor paging if users keep more.
const THREAD_LIST_LIMIT = 100;

type StoredPart = { type: string; text?: string; state?: string; toolCallId?: string };

export interface ChatThreadSummary {
  id: string;
  title: string;
  lastMessageAt: string;
  createdAt: string;
}

/** Text of a user message's text parts, trimmed. */
export function userMessageText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text as string)
    .join('\n')
    .trim();
}

/**
 * What we persist per message: text, plus tool calls reduced to name/state so the
 * thread re-renders its tool chips. Tool inputs/outputs (raw ledger rows) are not stored.
 */
export function storableParts(parts: UIMessage['parts']): StoredPart[] {
  const stored: StoredPart[] = [];
  for (const part of parts) {
    if (part.type === 'text') {
      if (part.text) stored.push({ type: 'text', text: part.text });
    } else if (part.type.startsWith('tool-')) {
      const tool = part as { type: string; state?: string; toolCallId?: string };
      stored.push({
        type: tool.type,
        state: tool.state === 'output-error' ? 'output-error' : 'output-available',
        toolCallId: tool.toolCallId,
      });
    }
  }
  return stored;
}

export function threadTitle(text: string): string {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  return oneLine.length > THREAD_TITLE_CHARS
    ? `${oneLine.slice(0, THREAD_TITLE_CHARS - 1).trimEnd()}…`
    : oneLine || 'New chat';
}

function toSummary(thread: { id: string; title: string; lastMessageAt: Date; createdAt: Date }): ChatThreadSummary {
  return {
    id: thread.id,
    title: thread.title,
    lastMessageAt: thread.lastMessageAt.toISOString(),
    createdAt: thread.createdAt.toISOString(),
  };
}

export class AiChatService {
  static async listThreads(userId: string): Promise<ChatThreadSummary[]> {
    const threads = await AiChatRepository.listThreads(userId, THREAD_LIST_LIMIT);
    return threads.map(toSummary);
  }

  /** 404 for missing threads and for other users' threads alike, so ids can't be probed. */
  static async getOwnedThread(userId: string, threadId: string) {
    const thread = await AiChatRepository.findThreadById(threadId);
    if (!thread || thread.userId !== userId) {
      throw new HttpError(404, 'Chat not found');
    }
    return thread;
  }

  static async getThread(userId: string, threadId: string) {
    const thread = await this.getOwnedThread(userId, threadId);
    return { thread: toSummary(thread), messages: await this.loadMessages(thread.id) };
  }

  static async deleteThread(userId: string, threadId: string) {
    await this.getOwnedThread(userId, threadId);
    await AiChatRepository.deleteThread(threadId);
    return { deleted: true };
  }

  static async loadMessages(threadId: string): Promise<UIMessage[]> {
    const rows = await AiChatRepository.listMessages(threadId);
    return rows.map((row) => ({
      id: row.id,
      role: row.role as UIMessage['role'],
      parts: (row.parts as unknown as UIMessage['parts']) ?? [],
    }));
  }

  /**
   * Validates the new user message, creates the thread on its first message, stores the
   * message, and returns the thread's full history ending with it.
   */
  static async appendUserMessage(
    userId: string,
    threadId: string,
    parts: Array<{ type: string; text?: string }>,
  ): Promise<{ history: UIMessage[]; userMessage: UIMessage }> {
    const text = userMessageText(parts);
    if (!text) {
      throw new HttpError(400, 'Message cannot be empty');
    }
    if (text.length > MAX_CHAT_MESSAGE_CHARS) {
      throw new HttpError(400, `Message is too long (max ${MAX_CHAT_MESSAGE_CHARS} characters)`);
    }

    const existing = await AiChatRepository.findThreadById(threadId);
    if (existing && existing.userId !== userId) {
      throw new HttpError(404, 'Chat not found');
    }
    if (!existing) {
      await AiChatRepository.createThread({ id: threadId, userId, title: threadTitle(text) });
    }

    const history = existing ? await this.loadMessages(threadId) : [];
    // Server-generated id: message ids are global keys, so never trust the client's.
    const userMessage: UIMessage = { id: randomUUID(), role: 'user', parts: [{ type: 'text', text }] };
    await AiChatRepository.addMessage({
      id: userMessage.id,
      threadId,
      role: 'user',
      parts: storableParts(userMessage.parts) as unknown as Prisma.InputJsonValue,
    });

    return { history: [...history, userMessage], userMessage };
  }

  static async saveAssistantMessage(threadId: string, message: UIMessage): Promise<void> {
    const parts = storableParts(message.parts);
    if (parts.length === 0) return;
    await AiChatRepository.addMessage({
      id: message.id || randomUUID(),
      threadId,
      role: 'assistant',
      parts: parts as unknown as Prisma.InputJsonValue,
    });
  }

  /** History for the model: text only (tool outputs aren't stored), newest `limit` messages. */
  static modelContext(history: UIMessage[], limit: number): UIMessage[] {
    return history
      .map((message) => ({ ...message, parts: message.parts.filter((part) => part.type === 'text') }))
      .filter((message) => message.parts.length > 0)
      .slice(-limit);
  }
}
