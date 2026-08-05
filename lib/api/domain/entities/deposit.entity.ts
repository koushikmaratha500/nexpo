import { TransactionType } from '@prisma/client';

export interface Deposit {
  id: string;
  userId: string;
  type: TransactionType;
  currencyId: string | null;
  budgetDepositTypeId: string | null;
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
