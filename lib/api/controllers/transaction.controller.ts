import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '../services/transaction.service';
import { TransactionRepository } from '../repositories/transaction.repository';
import { ImportService } from '../services/import.service';
import {
  createTransactionSchema,
  updateTransactionSchema,
  approveRecurringSchema,
  importTransactionSchema,
} from '../dtos/transaction.dto';

interface ErrorWithMessage {
  message?: string;
  name?: string;
  errors?: { message?: string }[];
  issues?: { message?: string }[];
}

function getErrorMessage(error: unknown): string {
  const e = error as ErrorWithMessage;
  return e.message || 'An unexpected error occurred';
}

function getZodMessage(error: unknown): string | null {
  const e = error as ErrorWithMessage;
  if (e.name !== 'ZodError') return null;
  return e.errors?.[0]?.message || e.issues?.[0]?.message || 'Validation error';
}

export class TransactionController {
  static async create(req: NextRequest, userId: string) {
    try {
      const body = await req.json();
      const validated = createTransactionSchema.parse(body);

      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      const transaction = await TransactionService.createTransaction(userId, validated, { ip, ua });
      return NextResponse.json(transaction, { status: 201 });
    } catch (error: unknown) {
      const zodMsg = getZodMessage(error);
      if (zodMsg) return NextResponse.json({ error: zodMsg }, { status: 400 });
      return NextResponse.json({ error: getErrorMessage(error) || 'Failed to create transaction' }, { status: 400 });
    }
  }

  static async createFromParsed(body: Record<string, unknown>, userId: string, req: NextRequest) {
    try {
      const validated = createTransactionSchema.parse(body);

      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      const transaction = await TransactionService.createTransaction(userId, validated, { ip, ua });
      return NextResponse.json(transaction, { status: 201 });
    } catch (error: unknown) {
      const zodMsg = getZodMessage(error);
      if (zodMsg) return NextResponse.json({ error: zodMsg }, { status: 400 });
      return NextResponse.json({ error: getErrorMessage(error) || 'Failed to create transaction' }, { status: 400 });
    }
  }

  static async getById(_req: NextRequest, id: string, userId?: string) {
    try {
      const transaction = await TransactionService.getTransactionById(id, userId);
      return NextResponse.json(transaction);
    } catch (error: unknown) {
      return NextResponse.json({ error: getErrorMessage(error) || 'Transaction not found' }, { status: 404 });
    }
  }

  static async getAll(req: NextRequest, userId?: string) {
    try {
      const { searchParams } = new URL(req.url);
      const type = (searchParams.get('type') as 'DEBIT' | 'CREDIT') || undefined;
      const categoryId = searchParams.get('categoryId') || undefined;
      const category = searchParams.get('category') || undefined;
      const startDateStr = searchParams.get('startDate');
      const endDateStr = searchParams.get('endDate');
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);

      const startDate = startDateStr ? new Date(startDateStr) : undefined;
      const endDate = endDateStr ? new Date(endDateStr) : undefined;

      const result = await TransactionService.getTransactions({
        userId,
        type,
        categoryId,
        category,
        startDate,
        endDate,
        page,
        pageSize,
      });

      const items = TransactionRepository.serializeItems(result.items || []);

      return NextResponse.json({ items, total: result.total });
    } catch (error: unknown) {
      return NextResponse.json({ error: getErrorMessage(error) || 'Failed to fetch transactions' }, { status: 500 });
    }
  }

  static async update(req: NextRequest, id: string, userId: string) {
    try {
      const body = await req.json();
      const validated = updateTransactionSchema.parse(body);

      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      const updated = await TransactionService.updateTransaction(id, userId, validated, { ip, ua });
      return NextResponse.json(updated);
    } catch (error: unknown) {
      const zodMsg = getZodMessage(error);
      if (zodMsg) return NextResponse.json({ error: zodMsg }, { status: 400 });
      return NextResponse.json({ error: getErrorMessage(error) || 'Failed to update transaction' }, { status: 400 });
    }
  }

  static async updateFromParsed(body: Record<string, unknown>, id: string, userId: string, req: NextRequest) {
    try {
      const validated = updateTransactionSchema.parse(body);

      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      const updated = await TransactionService.updateTransaction(id, userId, validated, { ip, ua });
      return NextResponse.json(updated);
    } catch (error: unknown) {
      const zodMsg = getZodMessage(error);
      if (zodMsg) return NextResponse.json({ error: zodMsg }, { status: 400 });
      return NextResponse.json({ error: getErrorMessage(error) || 'Failed to update transaction' }, { status: 400 });
    }
  }

  static async delete(req: NextRequest, id: string, userId: string) {
    try {
      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      await TransactionService.deleteTransaction(id, userId, { ip, ua });
      return NextResponse.json({ success: true, message: 'Transaction soft-deleted successfully' });
    } catch (error: unknown) {
      return NextResponse.json({ error: getErrorMessage(error) || 'Failed to delete transaction' }, { status: 400 });
    }
  }

  /* --------------------------- Recurring support --------------------------- */

  static async getRecurring(req: NextRequest, userId: string) {
    try {
      const pending = await TransactionService.getPendingRecurring(userId);
      return NextResponse.json({
        items: pending.map((item) => ({
          ...item,
          dueDate: (item.dueDate as Date).toISOString(),
        })),
      });
    } catch (error: unknown) {
      return NextResponse.json({ error: getErrorMessage(error) || 'Failed to fetch recurring transactions' }, { status: 500 });
    }
  }

  static async approveRecurring(req: NextRequest, userId: string) {
    try {
      const body = await req.json();
      const validated = approveRecurringSchema.parse(body);

      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      const result = await TransactionService.approveRecurring(userId, validated.items, { ip, ua });
      return NextResponse.json({
        approved: result.created.length,
        skipped: result.skipped.length,
        transactions: TransactionRepository.serializeItems(result.created as unknown as Record<string, unknown>[]),
      });
    } catch (error: unknown) {
      const zodMsg = getZodMessage(error);
      if (zodMsg) return NextResponse.json({ error: zodMsg }, { status: 400 });
      return NextResponse.json({ error: getErrorMessage(error) || 'Failed to approve recurring transactions' }, { status: 400 });
    }
  }

  /* ----------------------------- Bulk CSV import ---------------------------- */

  static async getImportTemplate() {
    try {
      const template = await ImportService.buildTemplateFile();
      return NextResponse.json(template);
    } catch (error: unknown) {
      return NextResponse.json({ error: getErrorMessage(error) || 'Failed to generate template' }, { status: 500 });
    }
  }

  static async validateImport(req: NextRequest) {
    try {
      const formData = await req.formData();
      const file = formData.get('file');
      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: 'A CSV file is required' }, { status: 400 });
      }
      const content = await (file as File).text();
      const preview = await ImportService.validateCsv(content);
      return NextResponse.json(preview);
    } catch (error: unknown) {
      return NextResponse.json({ error: getErrorMessage(error) || 'Failed to validate CSV' }, { status: 500 });
    }
  }

  static async importTransactions(req: NextRequest, userId: string) {
    try {
      const body = await req.json();
      const validated = importTransactionSchema.parse(body);

      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

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
        { ip, ua }
      );

      return NextResponse.json({
        imported: result.count,
        transactions: TransactionRepository.serializeItems(result.created as unknown as Record<string, unknown>[]),
      });
    } catch (error: unknown) {
      const zodMsg = getZodMessage(error);
      if (zodMsg) return NextResponse.json({ error: zodMsg }, { status: 400 });
      return NextResponse.json({ error: getErrorMessage(error) || 'Failed to import transactions' }, { status: 400 });
    }
  }
}
