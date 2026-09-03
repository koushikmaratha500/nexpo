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
  documentUrl?: string;
  depositType?: 'Cash' | 'Account';
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

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}
