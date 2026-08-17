import { create } from 'zustand';
import axios from 'axios';
import { formatDate } from '@/lib/date';

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

// Map database Prisma response to client Transaction interface
const mapDbTransactionToTransaction = (dbTxn: any): Transaction => {
  const isCredit = dbTxn.type === 'CREDIT';
  const isDebit = dbTxn.type === 'DEBIT';

  const base = {
    id: dbTxn.id,
    type: dbTxn.type as TransactionType,
    title: dbTxn.title || dbTxn.merchant || 'Transaction Title',
    merchant: dbTxn.merchant || undefined,
    description: dbTxn.description || dbTxn.merchant || undefined,
    category: isCredit
      ? (dbTxn.budgetDepositType?.name || 'Other')
      : (dbTxn.category?.code || dbTxn.category?.name || 'FOOD'),
    date: formatDate(dbTxn.transactionDate || dbTxn.date),
    status: (isCredit ? 'VERIFIED' : 'PENDING') as 'VERIFIED' | 'PENDING' | 'DECLINED',
    amount: typeof dbTxn.amount === 'string' ? parseFloat(dbTxn.amount) : dbTxn.amount,
    submittedBy: dbTxn.user ? `${dbTxn.user.firstName || ''} ${dbTxn.user.lastName || ''}`.trim() : 'Alex Sterling',
    paymentType: (dbTxn.paymentType?.name || (isCredit ? 'Account' : 'Credit Card')),
    currency: dbTxn.currency?.code || 'INR',
    notes: dbTxn.notes || undefined,
    documentName: dbTxn.documentFileName || dbTxn.receiptFileName || undefined,
    documentSize: dbTxn.documentSize ? `${(dbTxn.documentSize / 1024).toFixed(0)} KB` : undefined,
    documentDate: dbTxn.documentFileName ? formatDate(dbTxn.transactionDate || dbTxn.date) : undefined,
    documentUrl: dbTxn.documentUrl || dbTxn.receiptUrl || undefined,
    receiptName: dbTxn.documentFileName || dbTxn.receiptFileName || undefined,
    receiptSize: dbTxn.documentSize ? `${(dbTxn.documentSize / 1024).toFixed(0)} KB` : undefined,
    receiptUrl: dbTxn.documentUrl || dbTxn.receiptUrl || undefined,
    receiptDate: dbTxn.documentFileName ? formatDate(dbTxn.transactionDate || dbTxn.date) : undefined,
    depositType: isCredit ? ((dbTxn.paymentType?.name || 'Account') as 'Cash' | 'Account') : undefined,
    isRecurring: dbTxn.isRecurring ?? false,
    recurringDay: dbTxn.recurringDay ?? null,
  };

  return base;
};

const LOCAL_STORAGE_KEY = 'nexpo_transactions_local';

const getLocalStorageTransactions = (): Transaction[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

const setLocalStorageTransactions = (transactions: Transaction[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {}
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
      const { type, categoryId, category, startDate, endDate } = filters || {};
      const params = new URLSearchParams();
      params.set('pageSize', '1000');
      if (type) params.set('type', type);
      if (categoryId) params.set('categoryId', categoryId);
      if (category) params.set('category', category);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await axios.get(`/api/user/transactions?${params.toString()}`);
      const items = response.data.items || response.data || [];
      const mapped = items.map(mapDbTransactionToTransaction);
      set({ transactions: mapped, isLoading: false });
      setLocalStorageTransactions(mapped);
    } catch (err: any) {
      console.warn('API fetchTransactions failed, falling back to local storage:', err);
      const local = getLocalStorageTransactions();
      set({ transactions: local, isLoading: false });
    }
  },

  addTransaction: async (txnData, file?: File | null) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('type', txnData.type);
      formData.append('title', txnData.merchant || txnData.title || '');
      formData.append('merchant', txnData.merchant || txnData.title || '');
      formData.append('category', txnData.category || '');
      formData.append('amount', String(txnData.amount));
      formData.append('transactionDate', txnData.date || '');
      formData.append('paymentType', txnData.paymentType || (txnData.type === 'CREDIT' ? 'Account' : 'Credit Card'));
      formData.append('notes', txnData.notes || txnData.merchant || txnData.title || '');
      formData.append('currency', txnData.currency || 'INR');
      formData.append('isRecurring', String(txnData.isRecurring ?? false));
      if (txnData.isRecurring && txnData.recurringDay != null) {
        formData.append('recurringDay', String(txnData.recurringDay));
      }

      if (file) {
        formData.append('file', file);
      }

      await axios.post('/api/user/transaction', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      set({ isLoading: false });
      await get().fetchTransactions();
      await get().fetchRecurring();
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Failed to add transaction' });
      throw err;
    }
  },

  updateTransaction: async (id, txnData, file?: File | null) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      if (txnData.type) formData.append('type', txnData.type);
      if (txnData.title || txnData.merchant) formData.append('title', txnData.merchant || txnData.title || '');
      if (txnData.merchant) formData.append('merchant', txnData.merchant);
      if (txnData.category) formData.append('category', txnData.category);
      if (txnData.amount !== undefined) formData.append('amount', String(txnData.amount));
      if (txnData.date) formData.append('transactionDate', txnData.date);
      if (txnData.paymentType) formData.append('paymentType', txnData.paymentType);
      if (txnData.notes !== undefined) formData.append('notes', txnData.notes || '');
      if (txnData.currency) formData.append('currency', txnData.currency);
      if (txnData.isRecurring !== undefined) formData.append('isRecurring', String(txnData.isRecurring));
      if (txnData.recurringDay !== undefined) {
        formData.append('recurringDay', txnData.recurringDay == null ? '' : String(txnData.recurringDay));
      }
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
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Failed to update transaction' });
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
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Failed to delete transaction' });
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
