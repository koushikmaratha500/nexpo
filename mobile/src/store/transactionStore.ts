import { create } from 'zustand';
import {
  API_ROUTES,
  apiDelete,
  apiGet,
  apiPost,
  apiUpload,
  formatDate,
  type PaginatedResponse,
  type PendingRecurring,
  type Transaction,
  type TransactionType,
} from '@nexpo/shared';

const FETCH_PAGE_SIZE = 100;
const MAX_FETCH_PAGES = 50;

function mapDbTransaction(dbTxn: Record<string, unknown>): Transaction {
  const type = dbTxn.type as TransactionType;
  const isCredit = type === 'CREDIT';
  const user = dbTxn.user as { firstName?: string; lastName?: string } | undefined;
  const category = dbTxn.category as { name?: string; code?: string } | undefined;
  const budgetDepositType = dbTxn.budgetDepositType as { name?: string } | undefined;
  const paymentType = dbTxn.paymentType as { name?: string } | undefined;
  const currency = dbTxn.currency as { code?: string } | undefined;
  const amount =
    typeof dbTxn.amount === 'string' ? parseFloat(dbTxn.amount) : (dbTxn.amount as number);

  return {
    id: String(dbTxn.id),
    type,
    title: String(dbTxn.title || dbTxn.merchant || 'Transaction Title'),
    merchant: dbTxn.merchant ? String(dbTxn.merchant) : undefined,
    description: dbTxn.description ? String(dbTxn.description) : undefined,
    category: isCredit
      ? budgetDepositType?.name || 'Other'
      : category?.name || category?.code || 'Food',
    date: formatDate(String(dbTxn.transactionDate || dbTxn.date || '')),
    status: (isCredit ? 'VERIFIED' : 'PENDING') as Transaction['status'],
    amount,
    submittedBy: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'You',
    paymentType: paymentType?.name || (isCredit ? 'Account' : 'Credit Card'),
    currency: currency?.code || 'INR',
    notes: dbTxn.notes ? String(dbTxn.notes) : undefined,
    documentName: dbTxn.documentFileName ? String(dbTxn.documentFileName) : undefined,
    documentUrl: dbTxn.documentUrl ? String(dbTxn.documentUrl) : undefined,
    isRecurring: Boolean(dbTxn.isRecurring),
    recurringDay: (dbTxn.recurringDay as number | null) ?? null,
    depositType: isCredit ? ((paymentType?.name || 'Account') as 'Cash' | 'Account') : undefined,
  };
}

async function fetchAllTransactionPages(filters?: {
  type?: TransactionType;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<unknown[]> {
  const params = new URLSearchParams();
  params.set('pageSize', String(FETCH_PAGE_SIZE));
  if (filters?.type) params.set('type', filters.type);
  if (filters?.categoryId) params.set('categoryId', filters.categoryId);
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate) params.set('endDate', filters.endDate);

  const allItems: unknown[] = [];
  let page = 1;
  let total = 0;

  do {
    params.set('page', String(page));
    const response = await apiGet<PaginatedResponse<unknown>>(
      `${API_ROUTES.transactions.list}?${params.toString()}`
    );
    total = response.total;
    allItems.push(...response.items);
    page += 1;
  } while (allItems.length < total && page <= MAX_FETCH_PAGES);

  return allItems;
}

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  recurringItems: PendingRecurring[];
  recurringLoading: boolean;
  fetchTransactions: (filters?: {
    type?: TransactionType;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<void>;
  addTransaction: (
    txn: Omit<Transaction, 'id' | 'submittedBy' | 'status'>,
    file?: { uri: string; name: string; type: string } | null
  ) => Promise<void>;
  updateTransaction: (
    id: string,
    txn: Partial<Transaction>,
    file?: { uri: string; name: string; type: string } | null
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  fetchRecurring: () => Promise<void>;
  approveRecurring: (items: { transactionId: string; dueDate: string }[]) => Promise<{
    approved: number;
    skipped: number;
  }>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,
  recurringItems: [],
  recurringLoading: false,

  fetchTransactions: async (filters) => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const items = await fetchAllTransactionPages(filters);
      set({ transactions: items.map((item) => mapDbTransaction(item as Record<string, unknown>)), isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch transactions',
      });
    }
  },

  addTransaction: async (txnData, file) => {
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
        formData.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
      }
      await apiUpload('POST', API_ROUTES.transactions.create, formData);
      set({ isLoading: false });
      await get().fetchTransactions();
      await get().fetchRecurring();
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to add transaction' });
      throw err;
    }
  },

  updateTransaction: async (id, txnData, file) => {
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
      if (txnData.documentName !== undefined) formData.append('documentFileName', txnData.documentName || '');
      if (txnData.documentName === '') formData.append('documentUrl', '');
      if (file) {
        formData.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
      }
      await apiUpload('PATCH', API_ROUTES.transactions.byId(id), formData);
      set({ isLoading: false });
      await get().fetchTransactions();
      await get().fetchRecurring();
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to update transaction' });
      throw err;
    }
  },

  deleteTransaction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiDelete(API_ROUTES.transactions.byId(id));
      set({ isLoading: false });
      await get().fetchTransactions();
      await get().fetchRecurring();
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to delete transaction' });
      throw err;
    }
  },

  fetchRecurring: async () => {
    if (get().recurringLoading) return;
    set({ recurringLoading: true });
    try {
      const response = await apiGet<{ items: PendingRecurring[] }>(API_ROUTES.transactions.recurring);
      set({ recurringItems: response.items || [], recurringLoading: false });
    } catch {
      set({ recurringItems: [], recurringLoading: false });
    }
  },

  approveRecurring: async (items) => {
    set({ recurringLoading: true });
    try {
      const response = await apiPost<{ approved?: number; skipped?: number }>(
        API_ROUTES.transactions.recurring,
        { items }
      );
      set({ recurringLoading: false });
      await get().fetchRecurring();
      await get().fetchTransactions();
      return { approved: response.approved ?? 0, skipped: response.skipped ?? 0 };
    } catch (err) {
      set({ recurringLoading: false });
      throw err;
    }
  },
}));
