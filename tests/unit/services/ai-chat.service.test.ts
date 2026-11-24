import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UIMessage } from 'ai';
import {
  AiChatService,
  storableParts,
  threadTitle,
} from '@/lib/api/services/ai-chat.service';
import { AiChatRepository } from '@/lib/api/repositories/ai-chat.repository';

vi.mock('@/lib/api/repositories/ai-chat.repository', () => ({
  AiChatRepository: {
    findThreadById: vi.fn(),
    createThread: vi.fn(),
    listThreads: vi.fn(),
    deleteThread: vi.fn(),
    listMessages: vi.fn(),
    addMessage: vi.fn(),
  },
}));

const repo = vi.mocked(AiChatRepository);
const THREAD = '11111111-1111-4111-8111-111111111111';

describe('AiChatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.listMessages.mockResolvedValue([]);
  });

  it('creates the thread on its first message, titled from the text', async () => {
    repo.findThreadById.mockResolvedValue(null);

    const { history, userMessage } = await AiChatService.appendUserMessage('user-1', THREAD, [
      { type: 'text', text: '  How much did I spend last month?  ' },
    ]);

    expect(repo.createThread).toHaveBeenCalledWith({
      id: THREAD,
      userId: 'user-1',
      title: 'How much did I spend last month?',
    });
    expect(repo.addMessage).toHaveBeenCalledWith(
      expect.objectContaining({ threadId: THREAD, role: 'user', parts: [{ type: 'text', text: 'How much did I spend last month?' }] }),
    );
    expect(history).toEqual([userMessage]);
  });

  it("continues an existing thread with its saved history", async () => {
    repo.findThreadById.mockResolvedValue({ id: THREAD, userId: 'user-1' } as never);
    repo.listMessages.mockResolvedValue([
      { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'hi' }] },
      { id: 'm2', role: 'assistant', parts: [{ type: 'text', text: 'hello' }] },
    ] as never);

    const { history } = await AiChatService.appendUserMessage('user-1', THREAD, [{ type: 'text', text: 'next' }]);

    expect(repo.createThread).not.toHaveBeenCalled();
    expect(history.map((m) => m.id).slice(0, 2)).toEqual(['m1', 'm2']);
    expect(history).toHaveLength(3);
  });

  it("refuses another user's thread as not found, without writing", async () => {
    repo.findThreadById.mockResolvedValue({ id: THREAD, userId: 'someone-else' } as never);

    await expect(
      AiChatService.appendUserMessage('user-1', THREAD, [{ type: 'text', text: 'hi' }]),
    ).rejects.toMatchObject({ status: 404 });
    await expect(AiChatService.getThread('user-1', THREAD)).rejects.toMatchObject({ status: 404 });
    await expect(AiChatService.deleteThread('user-1', THREAD)).rejects.toMatchObject({ status: 404 });
    expect(repo.addMessage).not.toHaveBeenCalled();
    expect(repo.deleteThread).not.toHaveBeenCalled();
  });

  it('rejects empty and over-long messages', async () => {
    await expect(
      AiChatService.appendUserMessage('user-1', THREAD, [{ type: 'file', text: undefined }]),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      AiChatService.appendUserMessage('user-1', THREAD, [{ type: 'text', text: 'x'.repeat(4001) }]),
    ).rejects.toMatchObject({ status: 400 });
    expect(repo.createThread).not.toHaveBeenCalled();
  });

  it('stores tool calls without their inputs or outputs', () => {
    const parts = [
      { type: 'text', text: 'You spent ₹1,200.' },
      { type: 'tool-readTransactions', state: 'output-available', toolCallId: 't1', input: {}, output: [{ amount: 1 }] },
    ] as unknown as UIMessage['parts'];

    expect(storableParts(parts)).toEqual([
      { type: 'text', text: 'You spent ₹1,200.' },
      { type: 'tool-readTransactions', state: 'output-available', toolCallId: 't1' },
    ]);
  });

  it('builds model context from text only, newest messages last', () => {
    const history = [
      { id: 'a', role: 'user', parts: [{ type: 'text', text: 'one' }] },
      { id: 'b', role: 'assistant', parts: [{ type: 'tool-x', state: 'output-available' }] },
      { id: 'c', role: 'assistant', parts: [{ type: 'text', text: 'two' }] },
    ] as unknown as UIMessage[];

    expect(AiChatService.modelContext(history, 1).map((m) => m.id)).toEqual(['c']);
    expect(AiChatService.modelContext(history, 10).map((m) => m.id)).toEqual(['a', 'c']);
  });

  it('shortens long titles', () => {
    expect(threadTitle('a'.repeat(80))).toHaveLength(60);
    expect(threadTitle('   ')).toBe('New chat');
  });
});
