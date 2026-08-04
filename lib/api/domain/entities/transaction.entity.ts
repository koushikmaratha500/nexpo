import { TransactionType } from '@prisma/client';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  currencyId: string | null;
  categoryId: string | null;
  paymentTypeId: string | null;
  budgetDepositTypeId: string | null;
  budgetTypeId: string | null;
  title: string;
  description: string | null;
  amount: number;
  transactionDate: Date;
  notes: string | null;
  documentUrl: string | null;
  documentFileName: string | null;
  documentMimeType: string | null;
  documentSize: number | null;
  merchant: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionParams {
  userId: string;
  type: TransactionType;
  currencyId?: string | null;
  categoryId?: string | null;
  paymentTypeId?: string | null;
  budgetDepositTypeId?: string | null;
  budgetTypeId?: string | null;
  title: string;
  description?: string | null;
  amount: number;
  transactionDate: Date;
  notes?: string | null;
  documentUrl?: string | null;
  documentFileName?: string | null;
  documentMimeType?: string | null;
  documentSize?: number | null;
  merchant?: string | null;
  status?: string;
}

export interface UpdateTransactionParams {
  userId?: string;
  type?: TransactionType;
  currencyId?: string | null;
  categoryId?: string | null;
  paymentTypeId?: string | null;
  budgetDepositTypeId?: string | null;
  budgetTypeId?: string | null;
  title?: string;
  description?: string | null;
  amount?: number;
  transactionDate?: Date;
  notes?: string | null;
  documentUrl?: string | null;
  documentFileName?: string | null;
  documentMimeType?: string | null;
  documentSize?: number | null;
  merchant?: string | null;
  status?: string;
}
