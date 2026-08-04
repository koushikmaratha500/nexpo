import { IRepository } from './IRepository';
import { Transaction } from '../../domain/entities/transaction.entity';
import { CreateTransactionParams, UpdateTransactionParams } from '../../domain/entities/transaction.entity';

export interface TransactionQueryParams {
  userId?: string;
  type?: 'DEBIT' | 'CREDIT';
  categoryId?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export interface ITransactionRepository
  extends IRepository<Transaction, CreateTransactionParams, UpdateTransactionParams> {
  findById(id: string, userId?: string): Promise<Transaction | null>;
  findAll(params: TransactionQueryParams): Promise<{ items: Transaction[]; total: number }>;
}
