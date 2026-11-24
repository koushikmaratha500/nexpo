'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import type { UIMessage } from 'ai';
import { AiAssistant } from '@/components/features/assistant';
import { ASSISTANT_PATH } from '@/components/features/assistant/AiChatHistoryMenu';
import { useToast } from '@/hooks/useToast';
import { useAiChatStore } from '@/store/aiChatStore';

interface LoadedChat {
  id: string;
  messages: UIMessage[];
}

export default function CustomerAssistantPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatParam = searchParams.get('chat');
  const { addToast } = useToast();
  const loadThreads = useAiChatStore((state) => state.loadThreads);

  // A new chat gets a client id; the server creates the thread on its first message,
  // then the URL becomes ?chat=<id> without remounting the conversation.
  const [draftId, setDraftId] = useState(() => crypto.randomUUID());
  const [prevChatParam, setPrevChatParam] = useState(chatParam);
  if (prevChatParam !== chatParam) {
    setPrevChatParam(chatParam);
    if (chatParam === null) setDraftId(crypto.randomUUID()); // "New chat" after a saved one
  }

  const chatId = chatParam ?? draftId;
  const needsLoad = chatParam !== null && chatParam !== draftId;
  const [loaded, setLoaded] = useState<LoadedChat | null>(null);

  useEffect(() => {
    if (!needsLoad || !chatParam) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await axios.get<{ messages: UIMessage[] }>(`/api/ai/chats/${chatParam}`);
        if (!cancelled) setLoaded({ id: chatParam, messages: res.data.messages ?? [] });
      } catch {
        if (cancelled) return;
        addToast('That chat could not be found', 'error');
        router.replace(ASSISTANT_PATH);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [needsLoad, chatParam, addToast, router]);

  const handleReplyFinished = useCallback(() => {
    if (!chatParam) {
      router.replace(`${ASSISTANT_PATH}?chat=${draftId}`, { scroll: false });
    }
    void loadThreads();
  }, [chatParam, draftId, router, loadThreads]);

  const isLoadingChat = needsLoad && loaded?.id !== chatParam;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">AI Assistant</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
            Ask Finlit about your spending, income, cashflow forecasts and subscriptions. Past chats are under
            AI Assistant in the menu.
          </p>
        </div>
      </div>

      {isLoadingChat ? (
        <p className="py-16 text-center text-on-surface-variant">Loading chat…</p>
      ) : (
        <AiAssistant
          key={chatId}
          chatId={chatId}
          initialMessages={needsLoad ? loaded?.messages : undefined}
          onReplyFinished={handleReplyFinished}
        />
      )}
    </div>
  );
}
