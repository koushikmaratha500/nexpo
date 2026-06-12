import { NextRequest, NextResponse } from 'next/server';
import { DepositService } from '../services/deposit.service';
import { createDepositSchema, updateDepositSchema } from '../dtos/deposit.dto';

export class DepositController {
  static async create(req: NextRequest, userId: string) {
    try {
      const body = await req.json();
      const validated = createDepositSchema.parse(body);

      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      const deposit = await DepositService.createDeposit(userId, validated, { ip, ua });
      return NextResponse.json(deposit, { status: 201 });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to create deposit' }, { status: 400 });
    }
  }

  static async createFromParsed(body: Record<string, any>, userId: string, req: NextRequest) {
    try {
      const validated = createDepositSchema.parse(body);

      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      const deposit = await DepositService.createDeposit(userId, validated, { ip, ua });
      return NextResponse.json(deposit, { status: 201 });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to create deposit' }, { status: 400 });
    }
  }

  static async getById(req: NextRequest, id: string, userId?: string) {
    try {
      const deposit = await DepositService.getDepositById(id, userId);
      return NextResponse.json(deposit);
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Deposit not found' }, { status: 404 });
    }
  }

  static async getAll(req: NextRequest, userId?: string) {
    try {
      const { searchParams } = new URL(req.url);
      const category = searchParams.get('category') || undefined;
      const startDateStr = searchParams.get('startDate');
      const endDateStr = searchParams.get('endDate');
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);

      const startDate = startDateStr ? new Date(startDateStr) : undefined;
      const endDate = endDateStr ? new Date(endDateStr) : undefined;

      const result = await DepositService.getDeposits({
        userId,
        category,
        startDate,
        endDate,
        page,
        pageSize,
      });

      return NextResponse.json(result);
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Failed to fetch deposits' }, { status: 500 });
    }
  }

  static async update(req: NextRequest, id: string, userId: string) {
    try {
      const body = await req.json();
      const validated = updateDepositSchema.parse(body);

      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      const updated = await DepositService.updateDeposit(id, userId, validated, { ip, ua });
      return NextResponse.json(updated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to update deposit' }, { status: 400 });
    }
  }

  static async updateFromParsed(body: Record<string, any>, id: string, userId: string, req: NextRequest) {
    try {
      const validated = updateDepositSchema.parse(body);

      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      const updated = await DepositService.updateDeposit(id, userId, validated, { ip, ua });
      return NextResponse.json(updated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to update deposit' }, { status: 400 });
    }
  }

  static async delete(req: NextRequest, id: string, userId: string) {
    try {
      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      await DepositService.deleteDeposit(id, userId, { ip, ua });
      return NextResponse.json({ success: true, message: 'Deposit soft-deleted successfully' });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Failed to delete deposit' }, { status: 400 });
    }
  }
}
