'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/lib/date';
import { useAiChatStore, type AiChatThreadSummary } from '@/store/aiChatStore';

export const ASSISTANT_PATH = '/customer/assistant';

export interface AiChatHistoryMenuProps {
  /** Called after a chat link is chosen, e.g. to close the mobile drawer. */
  onNavigate?: () => void;
}

/** Saved chats listed under "AI Assistant" in the sidebar: new chat, open, delete. */
export function AiChatHistoryMenu({ onNavigate }: AiChatHistoryMenuProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get('chat');
  const { addToast } = useToast();
  const { threads, isLoading, hasLoaded, loadThreads, deleteThread } = useAiChatStore();
  const [pendingDelete, setPendingDelete] = useState<AiChatThreadSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (hasLoaded) return;
    void (async () => {
      await loadThreads();
    })();
  }, [hasLoaded, loadThreads]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteThread(pendingDelete.id);
      if (pendingDelete.id === activeId) {
        router.replace(ASSISTANT_PATH);
      }
      addToast('Chat deleted', 'success');
      setPendingDelete(null);
    } catch {
      addToast('Could not delete chat', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="ml-6 mt-1 mb-2 flex flex-col gap-0.5 border-l border-outline-variant pl-2">
      <Link
        href={ASSISTANT_PATH}
        onClick={onNavigate}
        data-track="ai_chat_new"
        className="flex items-center gap-2 px-2 py-1.5 rounded-md text-label-md font-semibold text-primary hover:bg-surface-container"
      >
        <span className="material-symbols-outlined text-[18px]">add_comment</span>
        New chat
      </Link>

      <div className="max-h-72 overflow-y-auto flex flex-col gap-0.5" aria-label="Previous chats">
        {isLoading && threads.length === 0 && (
          <p className="px-2 py-1.5 text-[11px] text-on-surface-variant">Loading chats…</p>
        )}
        {hasLoaded && !isLoading && threads.length === 0 && (
          <p className="px-2 py-1.5 text-[11px] text-on-surface-variant">No saved chats yet</p>
        )}
        {threads.map((thread) => {
          const isActive = thread.id === activeId;
          return (
            <div
              key={thread.id}
              className={`group flex items-center gap-1 rounded-md ${
                isActive ? 'bg-surface-container-high' : 'hover:bg-surface-container'
              }`}
            >
              <Link
                href={`${ASSISTANT_PATH}?chat=${thread.id}`}
                onClick={onNavigate}
                title={thread.title}
                className={`flex-1 min-w-0 px-2 py-1.5 ${isActive ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}
              >
                <span className="block truncate text-label-md">{thread.title}</span>
                <span className="block text-[10px] opacity-70">{formatDate(thread.lastMessageAt)}</span>
              </Link>
              <button
                type="button"
                onClick={() => setPendingDelete(thread)}
                aria-label={`Delete chat ${thread.title}`}
                className="shrink-0 p-1 mr-1 rounded text-on-surface-variant opacity-60 hover:opacity-100 hover:text-error cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={pendingDelete !== null}
        onClose={() => !isDeleting && setPendingDelete(null)}
        title="Delete chat?"
        subtitle={pendingDelete?.title}
        maxWidth="max-w-sm"
      >
        <p className="text-body-md text-on-surface-variant">
          This permanently deletes the conversation and its messages.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPendingDelete(null)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button onClick={() => void confirmDelete()} disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
