import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { TransactionService } from '../services/transaction.service';
import { TransactionRepository } from '../repositories/transaction.repository';
import { ImportService } from '../services/import.service';
import {
  createTransactionSchema,
  updateTransactionSchema,
  approveRecurringSchema,
  importTransactionSchema,
} from '../dtos/transaction.dto';
import { parsePaginationParams } from '../dtos/pagination.dto';

export class TransactionController extends BaseController {
  static async create(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = createTransactionSchema.parse(body);
      const meta = this.requestMeta(req);
      return TransactionService.createTransaction(userId, validated, meta);
    }, { status: 201, fallbackMessage: 'Failed to create transaction' });
  }

  static async createFromParsed(body: Record<string, unknown>, userId: string, req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const validated = createTransactionSchema.parse(body);
      const meta = this.requestMeta(req);
      return TransactionService.createTransaction(userId, validated, meta);
    }, { status: 201, fallbackMessage: 'Failed to create transaction' });
  }

  static async getById(_req: NextRequest, id: string, userId?: string) {
    return this.safeExecuteJson(
      async () => TransactionService.getTransactionById(id, userId),
      { errorStatus: 404, fallbackMessage: 'Transaction not found' },
    );
  }

  static async getAll(req: NextRequest, userId?: string) {
    return this.safeExecuteJson(async () => {
      const { searchParams } = new URL(req.url);
      const type = (searchParams.get('type') as 'DEBIT' | 'CREDIT') || undefined;
      const categoryId = searchParams.get('categoryId') || undefined;
      const category = searchParams.get('category') || undefined;
      const startDateStr = searchParams.get('startDate');
      const endDateStr = searchParams.get('endDate');
      const { page, pageSize } = parsePaginationParams(searchParams);

      const result = await TransactionService.getTransactions({
        userId,
        groupId: null,
        type,
        categoryId,
        category,
        startDate: startDateStr ? new Date(startDateStr) : undefined,
        endDate: endDateStr ? new Date(endDateStr) : undefined,
        page,
        pageSize,
      });

      return {
        items: TransactionRepository.serializeItems(result.items || []),
        total: result.total,
      };
    }, { fallbackMessage: 'Failed to fetch transactions' });
  }

  static async update(req: NextRequest, id: string, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = updateTransactionSchema.parse(body);
      const meta = this.requestMeta(req);
      return TransactionService.updateTransaction(id, userId, validated, meta);
    }, { fallbackMessage: 'Failed to update transaction' });
  }

  static async updateFromParsed(body: Record<string, unknown>, id: string, userId: string, req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const validated = updateTransactionSchema.parse(body);
      const meta = this.requestMeta(req);
      return TransactionService.updateTransaction(id, userId, validated, meta);
    }, { fallbackMessage: 'Failed to update transaction' });
  }

  static async delete(req: NextRequest, id: string, userId: string) {
    return this.safeExecuteJson(async () => {
      const meta = this.requestMeta(req);
      await TransactionService.deleteTransaction(id, userId, meta);
      return { success: true, message: 'Transaction soft-deleted successfully' };
    }, { fallbackMessage: 'Failed to delete transaction' });
  }

  static async getRecurring(_req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const pending = await TransactionService.getPendingRecurring(userId);
      return {
        items: pending.map((item) => ({
          ...item,
          dueDate: (item.dueDate as Date).toISOString(),
        })),
      };
    }, { fallbackMessage: 'Failed to fetch recurring transactions' });
  }

  static async approveRecurring(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = approveRecurringSchema.parse(body);
      const meta = this.requestMeta(req);
      const result = await TransactionService.approveRecurring(userId, validated.items, meta);
      return {
        approved: result.created.length,
        skipped: result.skipped.length,
        transactions: TransactionRepository.serializeItems(result.created as unknown as Record<string, unknown>[]),
      };
    }, { fallbackMessage: 'Failed to approve recurring transactions' });
  }

  static async getImportTemplate() {
    return this.safeExecuteJson(
      async () => ImportService.buildTemplateFile(),
      { fallbackMessage: 'Failed to generate template' },
    );
  }

  static async validateImport(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const formData = await req.formData();
      const file = formData.get('file');
      if (!file || !(file instanceof File)) {
        throw new Error('A CSV file is required');
      }
      const content = await file.text();
      return ImportService.validateCsv(content);
    }, { fallbackMessage: 'Failed to validate CSV' });
  }

  static async importTransactions(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = importTransactionSchema.parse(body);
      const meta = this.requestMeta(req);
      const result = await ImportService.importRows(
        userId,
        validated.rows.map((row) => ({
          type: row.type,
          title: row.title ?? '',
          merchant: row.merchant ?? undefined,
          category: row.category ?? '',
          amount: row.amount,
          date: row.transactionDate,
          currency: row.currency ?? 'INR',
          paymentType: row.paymentType ?? undefined,
          notes: row.notes ?? undefined,
          isRecurring: row.isRecurring ?? false,
          recurringDay: row.recurringDay ?? undefined,
        })),
        meta,
      );
      return {
        imported: result.count,
        transactions: TransactionRepository.serializeItems(result.created as unknown as Record<string, unknown>[]),
      };
    }, { fallbackMessage: 'Failed to import transactions' });
  }
}
