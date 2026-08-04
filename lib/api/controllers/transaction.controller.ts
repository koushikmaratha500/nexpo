import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '../services/transaction.service';
import { TransactionRepository } from '../repositories/transaction.repository';
import {
  createTransactionSchema,
  updateTransactionSchema,
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
}
