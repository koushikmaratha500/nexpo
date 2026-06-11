import { create } from 'zustand';
import axios from 'axios';

export interface CreditTransaction {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: 'Salary' | 'Savings' | 'Gift' | 'Returns' | 'Other';
  notes?: string;
  type: 'Cash' | 'Account';
  documentName?: string;
  documentSize?: string;
  documentDate?: string;
  documentUrl?: string;
  date: string;
  status: 'VERIFIED' | 'PENDING' | 'DECLINED';
}

const MOCK_CREDITS: CreditTransaction[] = [
  {
    id: 'cr1',
    title: 'Q4 Salary Paycheck',
    amount: 85000.00,
    currency: 'INR',
    category: 'Salary',
    notes: 'Monthly corporate base pay disbursement.',
    type: 'Account',
    documentName: 'paycheck_slip_oct.pdf',
    documentSize: '450 KB',
    documentDate: 'Oct 30',
    date: 'Oct 30, 2023',
    status: 'VERIFIED',
    documentUrl: '/basic-text.pdf'
  },
  {
    id: 'cr2',
    title: 'Savings Account Interest',
    amount: 1240.50,
    currency: 'INR',
    category: 'Savings',
    notes: 'Quarterly interest yield on savings reserve.',
    type: 'Account',
    date: 'Oct 15, 2023',
    status: 'VERIFIED'
  },
  {
    id: 'cr3',
    title: 'Birthday Gift from Family',
    amount: 5000.00,
    currency: 'INR',
    category: 'Gift',
    notes: 'Gift from parents.',
    type: 'Cash',
    date: 'Oct 10, 2023',
    status: 'VERIFIED'
  },
  {
    id: 'cr4',
    title: 'Travel Expense Reimbursement',
    amount: 15400.00,
    currency: 'INR',
    category: 'Returns',
    notes: 'Refund for flight ticket refund claim.',
    type: 'Account',
    documentName: 'reimbursement_invoice.pdf',
    documentSize: '1.1 MB',
    documentDate: 'Oct 05',
    date: 'Oct 05, 2023',
    status: 'VERIFIED',
    documentUrl: '/basic-text.pdf'
  }
];

interface CreditState {
  credits: CreditTransaction[];
  isLoading: boolean;
  error: string | null;
  fetchCredits: () => Promise<void>;
  addCredit: (credit: Omit<CreditTransaction, 'id' | 'status' | 'currency'>) => Promise<void>;
  updateCredit: (id: string, credit: Partial<CreditTransaction>) => Promise<void>;
  deleteCredit: (id: string) => Promise<void>;
}

const LOCAL_STORAGE_KEY = 'nexpo_credits_local';

const getLocalStorageCredits = (): CreditTransaction[] => {
  if (typeof window === 'undefined') return MOCK_CREDITS;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : MOCK_CREDITS;
  } catch (e) {
    return MOCK_CREDITS;
  }
};

const setLocalStorageCredits = (credits: CreditTransaction[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(credits));
  } catch (e) {}
};

export const useCreditStore = create<CreditState>((set, get) => ({
  credits: [],
  isLoading: false,
  error: null,

  fetchCredits: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/api/credits');
      set({ credits: response.data, isLoading: false });
      setLocalStorageCredits(response.data);
    } catch (err: any) {
      console.warn('API fetchCredits failed, falling back to local storage:', err);
      const local = getLocalStorageCredits();
      set({ credits: local, isLoading: false });
    }
  },

  addCredit: async (newCreditData) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        ...newCreditData,
        currency: 'INR',
      };
      const response = await axios.post('/api/credits', payload);
      set((state) => {
        const updated = [response.data, ...state.credits];
        setLocalStorageCredits(updated);
        return { credits: updated, isLoading: false };
      });
    } catch (err: any) {
      console.warn('API addCredit failed, writing locally:', err);
      set((state) => {
        const localNew: CreditTransaction = {
          ...newCreditData,
          id: `local-cr-${Date.now()}`,
          currency: 'INR',
          status: 'VERIFIED',
          // Format date nicely if input is YYYY-MM-DD
          date: newCreditData.date.includes(',') 
            ? newCreditData.date 
            : new Date(newCreditData.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        };
        const updated = [localNew, ...state.credits];
        setLocalStorageCredits(updated);
        return { credits: updated, isLoading: false };
      });
    }
  },

  updateCredit: async (id, updatedCreditData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`/api/credits/${id}`, updatedCreditData);
      set((state) => {
        const updated = state.credits.map((c) => (c.id === id ? response.data : c));
        setLocalStorageCredits(updated);
        return { credits: updated, isLoading: false };
      });
    } catch (err: any) {
      console.warn('API updateCredit failed, updating locally:', err);
      set((state) => {
        const updated = state.credits.map((c) => {
          if (c.id === id) {
            return {
              ...c,
              ...updatedCreditData,
              // Format date nicely if date changed
              date: updatedCreditData.date
                ? (updatedCreditData.date.includes(',') 
                    ? updatedCreditData.date 
                    : new Date(updatedCreditData.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }))
                : c.date,
            };
          }
          return c;
        });
        setLocalStorageCredits(updated);
        return { credits: updated, isLoading: false };
      });
    }
  },

  deleteCredit: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`/api/credits/${id}`);
      set((state) => {
        const updated = state.credits.filter((c) => c.id !== id);
        setLocalStorageCredits(updated);
        return { credits: updated, isLoading: false };
      });
    } catch (err: any) {
      console.warn('API deleteCredit failed, removing locally:', err);
      set((state) => {
        const updated = state.credits.filter((c) => c.id !== id);
        setLocalStorageCredits(updated);
        return { credits: updated, isLoading: false };
      });
    }
  },
}));
