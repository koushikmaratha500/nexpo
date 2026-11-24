import { z } from 'zod';

/** Longest user prompt we accept in one message. */
export const MAX_CHAT_MESSAGE_CHARS = 4000;

/**
 * Body sent by the AI Assistant: the thread id plus only the newest user message.
 * History is always rebuilt from the database, never trusted from the client.
 */
export const chatRequestSchema = z.object({
  id: z.string().uuid('Invalid chat id'),
  message: z.object({
    role: z.literal('user'),
    parts: z.array(z.object({ type: z.string(), text: z.string().optional() }).passthrough()).min(1),
  }),
});

export const chatThreadIdSchema = z.string().uuid('Invalid chat id');

export type ChatRequestDto = z.infer<typeof chatRequestSchema>;
