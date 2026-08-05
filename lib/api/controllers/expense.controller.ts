import { NextRequest, NextResponse } from 'next/server';
import { ExpenseService } from '../services/expense.service';
import { createExpenseSchema, updateExpenseSchema } from '../dtos/expense.dto';

export class ExpenseController {
  /** Legacy: create from req.json() — kept for backward compatibility */
  static async create(req: NextRequest, userId: string) {
    try {
      const body = await req.json();
      const validated = createExpenseSchema.parse(body);

      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      const expense = await ExpenseService.createExpense(userId, validated, { ip, ua });
      return NextResponse.json(expense, { status: 201 });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to create expense' }, { status: 400 });
    }
  }

  /** Create from pre-parsed FormData body (used by the FormData route handler) */
  static async createFromParsed(body: Record<string, any>, userId: string, req: NextRequest) {
    try {
      const validated = createExpenseSchema.parse(body);

      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      const expense = await ExpenseService.createExpense(userId, validated, { ip, ua });
      return NextResponse.json(expense, { status: 201 });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to create expense' }, { status: 400 });
    }
  }

  static async getById(req: NextRequest, id: string, userId?: string) {
    try {
      const expense = await ExpenseService.getExpenseById(id, userId);
      return NextResponse.json(expense);
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Expense not found' }, { status: 404 });
    }
  }

  static async getAll(req: NextRequest, userId?: string) {
    try {
      const { searchParams } = new URL(req.url);
      const categoryId = searchParams.get('categoryId') || undefined;
      const startDateStr = searchParams.get('startDate');
      const endDateStr = searchParams.get('endDate');
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);

      const startDate = startDateStr ? new Date(startDateStr) : undefined;
      const endDate = endDateStr ? new Date(endDateStr) : undefined;

      const result = await ExpenseService.getExpenses({
        userId,
        categoryId,
        startDate,
        endDate,
        page,
        pageSize,
      });

      return NextResponse.json(result);
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Failed to fetch expenses' }, { status: 500 });
    }
  }

  /** Legacy: update from req.json() */
  static async update(req: NextRequest, id: string, userId: string) {
    try {
      const body = await req.json();
      const validated = updateExpenseSchema.parse(body);

      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      const updated = await ExpenseService.updateExpense(id, userId, validated, { ip, ua });
      return NextResponse.json(updated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to update expense' }, { status: 400 });
    }
  }

  /** Update from pre-parsed FormData body (used by the FormData route handler) */
  static async updateFromParsed(body: Record<string, any>, id: string, userId: string, req: NextRequest) {
    try {
      const validated = updateExpenseSchema.parse(body);

      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      const updated = await ExpenseService.updateExpense(id, userId, validated, { ip, ua });
      return NextResponse.json(updated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to update expense' }, { status: 400 });
    }
  }

  static async delete(req: NextRequest, id: string, userId: string) {
    try {
      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      await ExpenseService.deleteExpense(id, userId, { ip, ua });
      return NextResponse.json({ success: true, message: 'Expense soft-deleted successfully' });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Failed to delete expense' }, { status: 400 });
    }
  }
}
