'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Markdown } from '@/components/ui/Markdown';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/store/authStore';

export interface AiAssistantProps {
  initialMessages?: UIMessage[];
}

const SUGGESTED_PROMPTS = [
  'How much did I spend last month?',
  'Compare this month vs last month',
  'Forecast my cashflow for next month',
  'Find subscriptions I should cancel',
];

const TOOL_LABELS: Record<string, string> = {
  'tool-readTransactions': 'Read transactions',
  'tool-monthlySummary': 'Monthly summary',
  'tool-forecastCashflow': 'Cashflow forecast',
  'tool-getSavingsOpportunities': 'Savings scan',
};

function ToolChip({ part }: { part: { type: string; state?: string } }) {
  const label = TOOL_LABELS[part.type] ?? part.type.replace('tool-', '');
  const done = part.state === 'output-available' || part.state === 'output-error';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-label-sm font-medium ${
        part.state === 'output-error'
          ? 'border-error/30 bg-error-container/20 text-error'
          : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant'
      }`}
    >
      <span className={`material-symbols-outlined text-[13px] ${done ? 'text-primary' : ''}`}>
        {done ? 'check_circle' : 'query_stats'}
      </span>
      {label}
    </span>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user';
  type TextPart = Extract<UIMessage['parts'][number], { type: 'text' }>;
  const textParts = message.parts.filter((p): p is TextPart => p.type === 'text' && Boolean(p.text));
  const toolParts = message.parts.filter((p) => p.type.startsWith('tool-'));
  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'bg-primary text-on-primary rounded-br-sm'
            : 'bg-surface-container-low border border-outline-variant rounded-bl-sm'
        }`}
      >
        {textParts.length === 0 && toolParts.length > 0 && (
          <p className="text-label-sm text-on-surface-variant">Consulting your data&hellip;</p>
        )}
        {textParts.map((part, i) =>
          isUser ? (
            <p key={i} className="whitespace-pre-wrap font-body-md text-body-md text-inherit">
              {part.text}
            </p>
          ) : (
            <Markdown key={i} content={part.text} />
          )
        )}
      </div>
      {!isUser && toolParts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5 pl-1">
          {toolParts.map((part, i) => (
            <ToolChip key={i} part={part} />
          ))}
        </div>
      )}
    </div>
  );
}

const WELCOME_MESSAGE: UIMessage = {
  id: 'welcome',
  role: 'assistant',
  parts: [
    {
      type: 'text',
      text: 'Hi! I\u2019m Finlit, your finance copilot. Ask me about your spending, income, forecasts, or subscriptions.',
    },
  ],
};

export function AiAssistant({ initialMessages }: AiAssistantProps) {
  const [input, setInput] = useState('');
  const { addToast } = useToast();

  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai/chat',
      headers: () => ({ Authorization: `Bearer ${useAuthStore.getState().token}` }),
    }),
    messages: [WELCOME_MESSAGE, ...(initialMessages ?? [])],
  });

  React.useEffect(() => {
    if (error) {
      addToast(error.message || 'Something went wrong with the assistant', 'error');
    }
  }, [error, addToast]);

  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
    }
  }, [messages]);

  const isBusy = status === 'submitted' || status === 'streaming';

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    void sendMessage({ text: trimmed });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-9rem)] p-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-outline-variant">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-[22px]">smart_toy</span>
          <div>
            <h2 className="font-title-md text-title-md text-on-surface font-semibold">AI Assistant</h2>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Answers about your own data only
            </p>
          </div>
        </div>
        {isBusy && (
          <Button variant="secondary" onClick={stop} className="!px-3 !py-1.5 text-label-md">
            <span className="material-symbols-outlined text-[16px]">stop_circle</span>
            Stop
          </Button>
        )}
      </div>

      <div ref={messagesRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={isBusy}
                className="px-3 py-1.5 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface-variant text-label-md font-medium hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-outline-variant bg-surface-container-lowest">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask about your money..."
            className="flex-1 resize-none bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <Button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isBusy}
            className="!px-3.5 !py-2.5"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </Button>
        </div>
        <p className="mt-2 font-label-sm text-label-sm text-on-surface-variant">
          Finlit only reads your transactions. Forecasts and subscription detection are estimates.
        </p>
      </div>
    </Card>
  );
}
