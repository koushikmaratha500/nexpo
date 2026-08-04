import { IRepository } from './IRepository';
import { Category } from '../../domain/entities/category.entity';

export interface ICategoryRepository
  extends IRepository<Category, { name: string; code: string; type: 'DEBIT' | 'CREDIT' }, { name?: string; code?: string; type?: 'DEBIT' | 'CREDIT'; color?: string | null; icon?: string | null; status?: string }> {
  findByName(name: string): Promise<Category | null>;
  findByType(type: 'DEBIT' | 'CREDIT'): Promise<Category[]>;
  getCategories(): Promise<Category[]>;
  getDebitCategories(): Promise<Category[]>;
  getCreditCategories(): Promise<Category[]>;
}
