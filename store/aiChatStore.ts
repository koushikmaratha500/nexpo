import { create } from 'zustand';
import axios from 'axios';

export interface AiChatThreadSummary {
  id: string;
  title: string;
  lastMessageAt: string;
  createdAt: string;
}

interface AiChatState {
  threads: AiChatThreadSummary[];
  isLoading: boolean;
  hasLoaded: boolean;
  loadThreads: () => Promise<void>;
  deleteThread: (id: string) => Promise<void>;
}

/** Saved AI Assistant chats, shared by the sidebar history menu and the assistant page. */
export const useAiChatStore = create<AiChatState>((set) => ({
  threads: [],
  isLoading: false,
  hasLoaded: false,
  loadThreads: async () => {
    set({ isLoading: true });
    try {
      const res = await axios.get<{ threads: AiChatThreadSummary[] }>('/api/ai/chats');
      set({ threads: res.data.threads ?? [], hasLoaded: true });
    } catch {
      set({ hasLoaded: true });
    } finally {
      set({ isLoading: false });
    }
  },
  deleteThread: async (id) => {
    await axios.delete(`/api/ai/chats/${id}`);
    set((state) => ({ threads: state.threads.filter((thread) => thread.id !== id) }));
  },
}));
