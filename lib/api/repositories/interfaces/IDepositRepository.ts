import { IRepository } from './IRepository';
import { Transaction } from '../../domain/entities/transaction.entity';
import { CreateTransactionParams, UpdateTransactionParams } from '../../domain/entities/transaction.entity';

export interface DepositQueryParams {
  userId?: string;
  page?: number;
  pageSize?: number;
}

export interface IDepositRepository
  extends IRepository<Transaction, CreateTransactionParams, UpdateTransactionParams> {
  findById(id: string, userId?: string): Promise<Transaction | null>;
  findAll(params: DepositQueryParams): Promise<{ items: Transaction[]; total: number }>;
}
