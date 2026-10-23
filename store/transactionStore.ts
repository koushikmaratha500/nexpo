import { create } from 'zustand';
import axios from 'axios';
import { mapDbTransactionToClient } from '@/lib/transactions/map-client-transaction';
import type { PaginatedResponse } from '@/types/api';

export type TransactionType = 'DEBIT' | 'CREDIT';

export interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  merchant?: string;
  description?: string;
  category: string;
  date: string;
  status: 'VERIFIED' | 'PENDING' | 'DECLINED';
  amount: number;
  submittedBy: string;
  paymentType: string;
  currency: string;
  notes?: string;
  documentName?: string;
  documentSize?: string;
  documentDate?: string;
  documentUrl?: string;
  receiptName?: string;
  receiptSize?: string;
  receiptUrl?: string;
  receiptDate?: string;
  // Credit-specific: Cash or Account (deposit method)
  depositType?: 'Cash' | 'Account';
  // Recurring support
  isRecurring?: boolean;
  recurringDay?: number | null;
  categoryType?: TransactionType;
}

export interface PendingRecurring {
  transactionId: string;
  dueDate: string;
  type: TransactionType;
  title: string;
  merchant?: string | null;
  category?: string | null;
  amount: number;
  currency: string;
  paymentType?: string | null;
  notes?: string | null;
  recurringDay?: number | null;
}

const LOCAL_STORAGE_KEY = 'nexpo_transactions_local';
const FETCH_PAGE_SIZE = 100;
const MAX_FETCH_PAGES = 50;

async function fetchAllTransactionPages(
  filters?: { type?: 'DEBIT' | 'CREDIT'; categoryId?: string; category?: string; startDate?: string; endDate?: string },
): Promise<unknown[]> {
  const { type, categoryId, category, startDate, endDate } = filters || {};
  const params = new URLSearchParams();
  params.set('pageSize', String(FETCH_PAGE_SIZE));
  if (type) params.set('type', type);
  if (categoryId) params.set('categoryId', categoryId);
  if (category) params.set('category', category);
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const allItems: unknown[] = [];
  let page = 1;
  let total = 0;

  do {
    params.set('page', String(page));
    const response = await axios.get<PaginatedResponse<unknown>>(`/api/user/transactions?${params.toString()}`);
    const { items, total: reportedTotal } = response.data;
    total = reportedTotal;
    allItems.push(...items);
    page += 1;
  } while (allItems.length < total && page <= MAX_FETCH_PAGES);

  return allItems;
}

const getLocalStorageTransactions = (): Transaction[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

function appendTransactionFormFields(formData: FormData, txnData: Partial<Transaction> & { type: TransactionType }) {
  formData.append('type', txnData.type);
  if (txnData.title !== undefined) formData.append('title', txnData.title);
  if (txnData.merchant !== undefined) formData.append('merchant', txnData.merchant);
  if (txnData.category) formData.append('category', txnData.category);
  if (txnData.amount !== undefined) formData.append('amount', String(txnData.amount));
  if (txnData.date) formData.append('transactionDate', txnData.date);
  if (txnData.currency) formData.append('currency', txnData.currency);
  if (txnData.notes !== undefined) formData.append('notes', txnData.notes || '');
  if (txnData.isRecurring !== undefined) formData.append('isRecurring', String(txnData.isRecurring));
  if (txnData.recurringDay !== undefined && txnData.recurringDay !== null) {
    formData.append('recurringDay', String(txnData.recurringDay));
  }

  if (txnData.type === 'CREDIT') {
    const depositMethod = txnData.depositType || txnData.paymentType || 'Account';
    formData.append('depositType', depositMethod);
    formData.append('paymentType', depositMethod);
  } else if (txnData.paymentType) {
    formData.append('paymentType', txnData.paymentType);
  }
}

const setLocalStorageTransactions = (transactions: Transaction[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
  } catch {
    /* ignore quota / private mode */
  }
};

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  recurringItems: PendingRecurring[];
  recurringLoading: boolean;
  recurringError: string | null;
  fetchTransactions: (filters?: { type?: 'DEBIT' | 'CREDIT'; categoryId?: string; category?: string; startDate?: string; endDate?: string }) => Promise<void>;
  addTransaction: (txn: Omit<Transaction, 'id' | 'submittedBy' | 'status'>, file?: File | null) => Promise<void>;
  updateTransaction: (id: string, txn: Partial<Transaction>, file?: File | null) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  fetchRecurring: () => Promise<void>;
  approveRecurring: (items: { transactionId: string; dueDate: string }[]) => Promise<{ approved: number; skipped: number }>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,
  recurringItems: [],
  recurringLoading: false,
  recurringError: null,

  fetchTransactions: async (filters?: { type?: 'DEBIT' | 'CREDIT'; categoryId?: string; category?: string; startDate?: string; endDate?: string }) => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const items = await fetchAllTransactionPages(filters);
      const mapped = items.map((item) => mapDbTransactionToClient(item as Record<string, unknown>) as Transaction);
      set({ transactions: mapped, isLoading: false });
      setLocalStorageTransactions(mapped);
    } catch (err: unknown) {
      console.warn('API fetchTransactions failed, falling back to local storage:', err);
      const local = getLocalStorageTransactions();
      set({ transactions: local, isLoading: false });
    }
  },

  addTransaction: async (txnData, file?: File | null) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      appendTransactionFormFields(formData, {
        ...txnData,
        type: txnData.type,
        isRecurring: txnData.isRecurring ?? false,
        currency: txnData.currency || 'INR',
      });

      if (file) {
        formData.append('file', file);
      }

      await axios.post('/api/user/transaction', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      set({ isLoading: false });
      await get().fetchTransactions();
      await get().fetchRecurring();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add transaction';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  updateTransaction: async (id, txnData, file?: File | null) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      const type = txnData.type ?? 'DEBIT';
      appendTransactionFormFields(formData, { ...txnData, type });
      // If documentName is provided (including empty string to clear), send it to the API
      if (txnData.documentName !== undefined) formData.append('documentFileName', txnData.documentName || '');
      // When clearing, also clear the URL
      if (txnData.documentName === '') formData.append('documentUrl', '');

      if (file) {
        formData.append('file', file);
      }

      await axios.patch(`/api/user/transaction/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      set({ isLoading: false });
      await get().fetchTransactions();
      await get().fetchRecurring();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update transaction';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  deleteTransaction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`/api/user/transaction/${id}`);
      set({ isLoading: false });
      await get().fetchTransactions();
      await get().fetchRecurring();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete transaction';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  fetchRecurring: async () => {
    if (get().recurringLoading) return;
    set({ recurringLoading: true, recurringError: null });
    try {
      const response = await axios.get('/api/user/transactions/recurring');
      const items = response.data?.items || [];
      set({ recurringItems: items, recurringLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch recurring transactions';
      set({ recurringItems: [], recurringLoading: false, recurringError: message });
    }
  },

  approveRecurring: async (items) => {
    set({ recurringLoading: true, recurringError: null });
    try {
      const response = await axios.post('/api/user/transactions/recurring', { items });
      const { approved = 0, skipped = 0 } = response.data || {};
      set({ recurringLoading: false, recurringError: null });
      await get().fetchRecurring();
      await get().fetchTransactions();
      return { approved, skipped };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to approve recurring transactions';
      set({ recurringLoading: false, recurringError: message });
      throw err;
    }
  },
}));
