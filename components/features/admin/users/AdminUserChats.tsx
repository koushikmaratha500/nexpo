'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import type { UIMessage } from 'ai';
import { Card } from '@/components/ui/Card';
import { MessageBubble } from '@/components/features/assistant';
import { formatDate, formatDateTime } from '@/lib/date';
import type { AiChatThreadSummary } from '@/store/aiChatStore';

export interface AdminUserChatsProps {
  userId: string;
}

interface OpenThread {
  thread: AiChatThreadSummary;
  messages: UIMessage[];
}

/** Admin → customer → AI chats: list of saved chats and a read-only view of one. */
export function AdminUserChats({ userId }: AdminUserChatsProps) {
  const [threads, setThreads] = useState<AiChatThreadSummary[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState<OpenThread | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await axios.get<{ threads: AiChatThreadSummary[] }>(`/api/admin/user/${userId}/chats`);
        if (!cancelled) setThreads(res.data.threads ?? []);
      } catch {
        if (!cancelled) setError('Failed to load chats');
      } finally {
        if (!cancelled) setIsLoadingList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await axios.get<OpenThread>(`/api/admin/user/${userId}/chats/${selectedId}`);
        if (!cancelled) setOpen(res.data);
      } catch {
        if (!cancelled) setError('Failed to load chat');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, selectedId]);

  const isLoadingThread = selectedId !== null && open?.thread.id !== selectedId;

  return (
    <Card className="bg-surface-container-lowest p-0 overflow-hidden" glass={false}>
      <div className="grid md:grid-cols-[18rem_1fr] min-h-[28rem]">
        <div className="border-b md:border-b-0 md:border-r border-outline-variant">
          <div className="px-md py-sm border-b border-outline-variant">
            <h3 className="font-title-md text-title-md text-primary font-bold">AI chats ({threads.length})</h3>
          </div>
          {isLoadingList && <p className="px-md py-md text-body-md text-on-surface-variant">Loading chats…</p>}
          {!isLoadingList && threads.length === 0 && (
            <div className="px-md py-xl flex flex-col items-center gap-sm text-center">
              <span className="material-symbols-outlined text-[40px] text-outline">forum</span>
              <p className="text-body-md text-on-surface-variant">This customer has no saved AI chats.</p>
            </div>
          )}
          <ul className="max-h-[32rem] overflow-y-auto">
            {threads.map((thread) => {
              const isActive = thread.id === selectedId;
              return (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSelectedId(thread.id);
                    }}
                    className={`w-full text-left px-md py-sm border-b border-outline-variant/40 cursor-pointer ${
                      isActive ? 'bg-surface-container-high' : 'hover:bg-surface-container'
                    }`}
                  >
                    <span className={`block truncate text-sm ${isActive ? 'text-primary font-bold' : 'text-on-surface font-medium'}`}>
                      {thread.title}
                    </span>
                    <span className="block text-[11px] text-on-surface-variant">
                      Last message {formatDate(thread.lastMessageAt)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col min-w-0">
          {error && <p className="px-md py-sm text-sm text-error">{error}</p>}
          {!selectedId && !error && (
            <div className="flex-1 flex flex-col items-center justify-center gap-sm p-xl text-center">
              <span className="material-symbols-outlined text-[40px] text-outline">chat</span>
              <p className="text-body-md text-on-surface-variant">Select a chat to view its messages.</p>
            </div>
          )}
          {isLoadingThread && !error && (
            <p className="px-md py-md text-body-md text-on-surface-variant">Loading chat…</p>
          )}
          {open && open.thread.id === selectedId && (
            <>
              <div className="px-md py-sm border-b border-outline-variant flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-title-md text-title-md text-on-surface font-semibold truncate">{open.thread.title}</h4>
                  <p className="text-[11px] text-on-surface-variant">
                    Started {formatDateTime(open.thread.createdAt)} · {open.messages.length} messages
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-outline-variant text-[11px] font-semibold text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                  Read-only
                </span>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[32rem] px-md py-md space-y-3">
                {open.messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>
              <p className="px-md py-sm border-t border-outline-variant text-[11px] text-on-surface-variant">
                Opening a chat is recorded in this customer&apos;s Activity Trail.
              </p>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
