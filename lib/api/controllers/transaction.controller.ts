import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '../services/transaction.service';
import { createTransactionSchema, updateTransactionSchema } from '../dtos/transaction.dto';

export class TransactionController {
  static async create(req: NextRequest, userId: string) {
    try {
      const body = await req.json();
      const validated = createTransactionSchema.parse(body);

      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      const transaction = await TransactionService.createTransaction(userId, validated, { ip, ua });
      return NextResponse.json(transaction, { status: 201 });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to create transaction' }, { status: 400 });
    }
  }

  static async createFromParsed(body: Record<string, any>, userId: string, req: NextRequest) {
    try {
      const validated = createTransactionSchema.parse(body);

      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      const transaction = await TransactionService.createTransaction(userId, validated, { ip, ua });
      return NextResponse.json(transaction, { status: 201 });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to create transaction' }, { status: 400 });
    }
  }

  static async getById(req: NextRequest, id: string, userId?: string) {
    try {
      const transaction = await TransactionService.getTransactionById(id, userId);
      return NextResponse.json(transaction);
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Transaction not found' }, { status: 404 });
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

      // Serialize Prisma Decimal amounts to numbers for JSON response
      const items = (result.items || []).map((t: any) => ({
        ...t,
        amount: typeof t.amount === 'object' && t.amount !== null ? Number(t.amount) : t.amount,
      }));

      return NextResponse.json({ items, total: result.total });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Failed to fetch transactions' }, { status: 500 });
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
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to update transaction' }, { status: 400 });
    }
  }

  static async updateFromParsed(body: Record<string, any>, id: string, userId: string, req: NextRequest) {
    try {
      const validated = updateTransactionSchema.parse(body);

      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      const updated = await TransactionService.updateTransaction(id, userId, validated, { ip, ua });
      return NextResponse.json(updated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to update transaction' }, { status: 400 });
    }
  }

  static async delete(req: NextRequest, id: string, userId: string) {
    try {
      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      await TransactionService.deleteTransaction(id, userId, { ip, ua });
      return NextResponse.json({ success: true, message: 'Transaction soft-deleted successfully' });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Failed to delete transaction' }, { status: 400 });
    }
  }
}
