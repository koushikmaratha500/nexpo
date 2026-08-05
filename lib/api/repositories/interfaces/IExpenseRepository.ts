import { IRepository } from './IRepository';
import { Transaction } from '../../domain/entities/transaction.entity';
import { CreateTransactionParams, UpdateTransactionParams } from '../../domain/entities/transaction.entity';

export interface ExpenseQueryParams {
  userId?: string;
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export interface IExpenseRepository
  extends IRepository<Transaction, CreateTransactionParams, UpdateTransactionParams> {
  findById(id: string, userId?: string): Promise<Transaction | null>;
  findAll(params: ExpenseQueryParams): Promise<{ items: Transaction[]; total: number }>;
}
