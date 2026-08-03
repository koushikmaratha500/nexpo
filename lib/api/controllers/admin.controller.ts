import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRepository } from '../repositories/user.repository';
import { AdminRepository } from '../repositories/admin.repository';
import { ExpenseRepository } from '../repositories/expense.repository';
import { DepositRepository } from '../repositories/deposit.repository';
import { hashPassword } from '../services/auth.service';
import { z } from 'zod';

const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().optional().nullable(),
  email: z.string().email('Provide a valid email address'),
  password: z.string().min(7, 'Password must be at least 7 characters long'),
  mobile: z.string().optional().nullable(),
  countryId: z.string().uuid().optional().nullable(),
  currencyId: z.string().uuid().optional().nullable(),
});

const updateUserSchema = createUserSchema.partial().extend({
  password: z.string().min(7).optional(),
});

const createAdminSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().optional().nullable(),
  email: z.string().email('Provide a valid email address'),
  password: z.string().min(7, 'Password must be at least 7 characters long'),
});

const updateAdminSchema = createAdminSchema.partial().extend({
  password: z.string().min(7).optional(),
});

export class AdminController {
  static async getDashboard(req: NextRequest) {
    try {
       const [userCount, expenseSum, budgetSum, ticketCount, recentExpenses, recentBudgets] = await Promise.all([
        prisma.user.count({ where: { status: { not: 'D' } } }),
        prisma.transaction.aggregate({ where: { status: { not: 'D' }, type: 'DEBIT' }, _sum: { amount: true } }),
        prisma.transaction.aggregate({ where: { status: { not: 'D' }, type: 'CREDIT' }, _sum: { amount: true } }),
        prisma.supportTicket.count({ where: { status: 'A' } }),
        prisma.transaction.findMany({
          where: { status: { not: 'D' }, type: 'DEBIT' },
          orderBy: { transactionDate: 'desc' },
          take: 5,
          include: { user: true, category: true, currency: true },
        }),
        prisma.transaction.findMany({
          where: { status: { not: 'D' }, type: 'CREDIT' },
          orderBy: { transactionDate: 'desc' },
          take: 5,
          include: { user: true, currency: true },
        }),
      ]);

      return NextResponse.json({
        userCount,
        totalExpenses: Number(expenseSum._sum.amount || 0),
        totalBudgets: Number(budgetSum._sum.amount || 0),
        openTicketsCount: ticketCount,
        recentExpenses,
        recentBudgets,
      });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Failed to fetch dashboard metrics' }, { status: 500 });
    }
  }

  static async getReports(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);
      const skip = (page - 1) * pageSize;
      const startDateStr = searchParams.get('startDate');
      const endDateStr = searchParams.get('endDate');

      const whereExpense: any = { status: { not: 'D' }, type: 'DEBIT' };
      const whereBudget: any = { status: { not: 'D' }, type: 'CREDIT' };

      if (startDateStr || endDateStr) {
        whereExpense.transactionDate = {};
        whereBudget.transactionDate = {};
        if (startDateStr) {
          const sDate = new Date(startDateStr);
          if (!isNaN(sDate.getTime())) {
            whereExpense.transactionDate.gte = sDate;
            whereBudget.transactionDate.gte = sDate;
          }
        }
        if (endDateStr) {
          const eDate = new Date(endDateStr);
          if (!isNaN(eDate.getTime())) {
            whereExpense.transactionDate.lte = eDate;
            whereBudget.transactionDate.lte = eDate;
          }
        }
      }

      const [expenses, budgets, totalExpensesCount, totalBudgetsCount] = await Promise.all([
        prisma.transaction.findMany({
          where: whereExpense,
          orderBy: { transactionDate: 'desc' },
          skip,
          take: pageSize,
          include: { user: true, category: true, currency: true },
        }),
        prisma.transaction.findMany({
          where: whereBudget,
          orderBy: { transactionDate: 'desc' },
          skip,
          take: pageSize,
          include: { user: true, currency: true },
        }),
        prisma.transaction.count({ where: whereExpense }),
        prisma.transaction.count({ where: whereBudget }),
      ]);

      return NextResponse.json({
        expenses: { items: expenses, total: totalExpensesCount },
        budgets: { items: budgets, total: totalBudgetsCount },
      });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Failed to fetch reports' }, { status: 500 });
    }
  }

  // Users Management
  static async getUsers(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);

      const result = await UserRepository.findAll(page, pageSize);
      return NextResponse.json(result);
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
    }
  }

  static async createUser(req: NextRequest) {
    try {
      const body = await req.json();
      const validated = createUserSchema.parse(body);

      const existing = await UserRepository.findByEmail(validated.email);
      if (existing) {
        return NextResponse.json({ error: 'Email is already registered' }, { status: 400 });
      }

      const hashedPassword = hashPassword(validated.password);

      const user = await UserRepository.create({
        firstName: validated.firstName,
        lastName: validated.lastName || null,
        email: validated.email,
        passwordHash: hashedPassword,
        mobile: validated.mobile || null,
        countryId: validated.countryId || null,
        currencyId: validated.currencyId || null,
        emailVerified: true,
      });

      return NextResponse.json(user, { status: 201 });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 400 });
    }
  }

  static async updateUser(req: NextRequest, id: string) {
    try {
      const body = await req.json();
      const validated = updateUserSchema.parse(body);

      const updateData: any = { ...validated };
      if (validated.password) {
        updateData.passwordHash = hashPassword(validated.password);
        delete updateData.password;
      }

      const updated = await UserRepository.update(id, updateData);
      return NextResponse.json(updated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 400 });
    }
  }

  static async deleteUser(req: NextRequest, id: string) {
    try {
      await UserRepository.softDelete(id);
      return NextResponse.json({ success: true, message: 'User soft-deleted successfully' });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 400 });
    }
  }

  static async getUserExpenses(req: NextRequest, userId: string) {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);

      const result = await ExpenseRepository.findAll({ userId, page, pageSize });
      return NextResponse.json(result);
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Failed to fetch user expenses' }, { status: 500 });
    }
  }

  static async getUserOverview(req: NextRequest, userId: string) {
    try {
      const [expenseSum, budgetSum, expenseCount, budgetCount] = await Promise.all([
        prisma.transaction.aggregate({ where: { userId, status: { not: 'D' }, type: 'DEBIT' }, _sum: { amount: true } }),
        prisma.transaction.aggregate({ where: { userId, status: { not: 'D' }, type: 'CREDIT' }, _sum: { amount: true } }),
        prisma.transaction.count({ where: { userId, status: { not: 'D' }, type: 'DEBIT' } }),
        prisma.transaction.count({ where: { userId, status: { not: 'D' }, type: 'CREDIT' } }),
      ]);

      return NextResponse.json({
        totalExpenses: Number(expenseSum._sum.amount || 0),
        totalBudgets: Number(budgetSum._sum.amount || 0),
        expenseCount,
        budgetCount,
      });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Failed to fetch user overview' }, { status: 500 });
    }
  }

  static async getUserAuditLogs(req: NextRequest, userId: string) {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);
      const skip = (page - 1) * pageSize;

      const [items, total] = await Promise.all([
        prisma.userAudit.findMany({
          where: { userId },
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.userAudit.count({ where: { userId } }),
      ]);

      return NextResponse.json({ items, total });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Failed to fetch user audit logs' }, { status: 500 });
    }
  }

  // Administrators Management
  static async getAdministrators(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);

      const result = await AdminRepository.findAll(page, pageSize);
      return NextResponse.json(result);
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Failed to fetch administrators' }, { status: 500 });
    }
  }

  static async createAdministrator(req: NextRequest) {
    try {
      const body = await req.json();
      const validated = createAdminSchema.parse(body);

      const existing = await AdminRepository.findByEmail(validated.email);
      if (existing) {
        return NextResponse.json({ error: 'Email is already registered' }, { status: 400 });
      }

      const hashedPassword = hashPassword(validated.password);

      const admin = await AdminRepository.create({
        firstName: validated.firstName,
        lastName: validated.lastName || null,
        email: validated.email,
        passwordHash: hashedPassword,
      });

      return NextResponse.json(admin, { status: 201 });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to create administrator' }, { status: 400 });
    }
  }

  static async updateAdministrator(req: NextRequest, id: string) {
    try {
      const body = await req.json();
      const validated = updateAdminSchema.parse(body);

      const updateData: any = { ...validated };
      if (validated.password) {
        updateData.passwordHash = hashPassword(validated.password);
        delete updateData.password;
      }

      const updated = await AdminRepository.update(id, updateData);
      return NextResponse.json(updated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to update administrator' }, { status: 400 });
    }
  }

  static async deleteAdministrator(req: NextRequest, id: string) {
    try {
      await AdminRepository.softDelete(id);
      return NextResponse.json({ success: true, message: 'Administrator soft-deleted successfully' });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Failed to delete administrator' }, { status: 400 });
    }
  }

  static async getAdministratorOverview(req: NextRequest, adminId: string) {
    try {
      const [sessions, activeSessionCount] = await Promise.all([
        prisma.session.findMany({
          where: { adminId },
          orderBy: { loginTime: 'desc' },
          take: 5,
        }),
        prisma.session.count({
          where: { adminId, status: 'A', logoutTime: null, expiryTime: { gte: new Date() } },
        }),
      ]);

      return NextResponse.json({
        recentSessions: sessions,
        activeSessions: activeSessionCount,
      });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Failed to fetch administrator overview' }, { status: 500 });
    }
  }

  static async getAdministratorAuditLogs(req: NextRequest, adminId: string) {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);
      const skip = (page - 1) * pageSize;

      const [items, total] = await Promise.all([
        prisma.supportTicketAudit.findMany({
          where: { adminId },
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.supportTicketAudit.count({ where: { adminId } }),
      ]);

      return NextResponse.json({ items, total });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Failed to fetch administrator audit logs' }, { status: 500 });
    }
  }
}
