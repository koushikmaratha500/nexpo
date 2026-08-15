import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '../services/admin.service';
import { UserRepository } from '../repositories/user.repository';
import { AdminRepository } from '../repositories/admin.repository';
import { ExpenseRepository } from '../repositories/expense.repository';
import { DepositRepository } from '../repositories/deposit.repository';
import {
  createUserSchema,
  updateUserSchema,
  createAdminSchema,
  updateAdminSchema,
  resetUserPasswordSchema,
} from '../dtos/admin.dto';

export class AdminController {
  static async getDashboard(_req: NextRequest) {
    void _req;
    try {
      const data = await AdminService.getDashboard();
      return NextResponse.json(data);
    } catch (error: unknown) {
      const e = error as Error;
      return NextResponse.json({ error: e.message || 'Failed to fetch dashboard metrics' }, { status: 500 });
    }
  }

  static async getReports(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const startDateStr = searchParams.get('startDate');
      const endDateStr = searchParams.get('endDate');
      const startDate = startDateStr ? new Date(startDateStr) : undefined;
      const endDate = endDateStr ? new Date(endDateStr) : undefined;

      const data = await AdminService.getReports({ startDate, endDate });
      return NextResponse.json(data);
    } catch (error: unknown) {
      const e = error as Error;
      return NextResponse.json({ error: e.message || 'Failed to fetch reports' }, { status: 500 });
    }
  }

  // Users Management
  static async getUser(_req: NextRequest, id: string) {
    try {
      const data = await AdminService.getUserWithStats(id);
      if (!data) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json(data);
    } catch (error: unknown) {
      const e = error as Error;
      return NextResponse.json({ error: e.message || 'Failed to fetch user' }, { status: 500 });
    }
  }

  static async getUsers(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);

      const result = await UserRepository.findAll(page, pageSize);
      return NextResponse.json(result);
    } catch (error: unknown) {
      const e = error as Error;
      return NextResponse.json({ error: e.message || 'Failed to fetch users' }, { status: 500 });
    }
  }

  static async createUser(req: NextRequest) {
    try {
      const body = await req.json();
      const validated = createUserSchema.parse(body);

      const user = await AdminService.createUser(validated, {
        ip: req.headers.get('x-forwarded-for') || null,
        ua: req.headers.get('user-agent') || null,
      });

      return NextResponse.json(user, { status: 201 });
    } catch (error: unknown) {
      const e = error as Error & { name?: string; errors?: unknown[]; issues?: unknown[] };
      if (e.name === 'ZodError') {
        const message = e.errors?.[0] ? String(e.errors[0]) : e.issues?.[0] ? String(e.issues[0]) : e.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: e.message || 'Failed to create user' }, { status: 400 });
    }
  }

  static async updateUser(req: NextRequest, id: string) {
    try {
      const body = await req.json();
      const validated = updateUserSchema.parse(body);

      const updated = await AdminService.updateUser(id, validated, {
        ip: req.headers.get('x-forwarded-for') || null,
        ua: req.headers.get('user-agent') || null,
      });

      return NextResponse.json(updated);
    } catch (error: unknown) {
      const e = error as Error & { name?: string; errors?: unknown[]; issues?: unknown[] };
      if (e.name === 'ZodError') {
        const message = e.errors?.[0] ? String(e.errors[0]) : e.issues?.[0] ? String(e.issues[0]) : e.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: e.message || 'Failed to update user' }, { status: 400 });
    }
  }

  static async deleteUser(req: NextRequest, id: string) {
    try {
      const result = await AdminService.deleteUser(id, {
        ip: req.headers.get('x-forwarded-for') || null,
        ua: req.headers.get('user-agent') || null,
      });
      return NextResponse.json(result);
    } catch (error: unknown) {
      const e = error as Error;
      return NextResponse.json({ error: e.message || 'Failed to delete user' }, { status: 400 });
    }
  }

  static async resetUserPassword(req: NextRequest, id: string) {
    try {
      const body = await req.json();
      const validated = resetUserPasswordSchema.parse(body);

      const updated = await AdminService.resetUserPassword(id, validated, {
        ip: req.headers.get('x-forwarded-for') || null,
        ua: req.headers.get('user-agent') || null,
      });

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully',
        user: {
          id: updated.id,
          forcedResetPassword: updated.forcedResetPassword,
          lastPasswordChangedDate: updated.lastPasswordChangedDate,
        },
      });
    } catch (error: unknown) {
      const e = error as Error & { name?: string; errors?: unknown[]; issues?: unknown[] };
      if (e.name === 'ZodError') {
        const message = e.errors?.[0] ? String(e.errors[0]) : e.issues?.[0] ? String(e.issues[0]) : e.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: e.message || 'Failed to reset password' }, { status: 400 });
    }
  }

  static async getUserExpenses(_req: NextRequest, userId: string) {
    try {
      const result = await ExpenseRepository.findAll({ userId, page: 1, pageSize: 100 });
      return NextResponse.json(result);
    } catch (error: unknown) {
      const e = error as Error;
      return NextResponse.json({ error: e.message || 'Failed to fetch user expenses' }, { status: 500 });
    }
  }

  static async getUserBudget(_req: NextRequest, userId: string) {
    try {
      const result = await DepositRepository.findAll({ userId, page: 1, pageSize: 100 });
      return NextResponse.json(result);
    } catch (error: unknown) {
      const e = error as Error;
      return NextResponse.json({ error: e.message || 'Failed to fetch user budgets' }, { status: 500 });
    }
  }

  static async getUserOverview(_req: NextRequest, userId: string) {
    try {
      const data = await AdminService.getUserOverview(userId);
      return NextResponse.json(data);
    } catch (error: unknown) {
      const e = error as Error;
      return NextResponse.json({ error: e.message || 'Failed to fetch user overview' }, { status: 500 });
    }
  }

  static async getUserAuditLogs(_req: NextRequest, userId: string) {
    try {
      const { searchParams } = new URL(_req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);

      const data = await AdminService.getUserAuditLogs(userId, page, pageSize);
      return NextResponse.json(data);
    } catch (error: unknown) {
      const e = error as Error;
      return NextResponse.json({ error: e.message || 'Failed to fetch user audit logs' }, { status: 500 });
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
    } catch (error: unknown) {
      const e = error as Error;
      return NextResponse.json({ error: e.message || 'Failed to fetch administrators' }, { status: 500 });
    }
  }

  static async createAdministrator(req: NextRequest) {
    try {
      const body = await req.json();
      const validated = createAdminSchema.parse(body);

      const admin = await AdminService.createAdmin(validated);
      return NextResponse.json(admin, { status: 201 });
    } catch (error: unknown) {
      const e = error as Error & { name?: string; errors?: unknown[]; issues?: unknown[] };
      if (e.name === 'ZodError') {
        const message = e.errors?.[0] ? String(e.errors[0]) : e.issues?.[0] ? String(e.issues[0]) : e.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: e.message || 'Failed to create administrator' }, { status: 400 });
    }
  }

  static async updateAdministrator(req: NextRequest, id: string) {
    try {
      const body = await req.json();
      const validated = updateAdminSchema.parse(body);

      const updated = await AdminService.updateAdmin(id, validated);
      return NextResponse.json(updated);
    } catch (error: unknown) {
      const e = error as Error & { name?: string; errors?: unknown[]; issues?: unknown[] };
      if (e.name === 'ZodError') {
        const message = e.errors?.[0] ? String(e.errors[0]) : e.issues?.[0] ? String(e.issues[0]) : e.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: e.message || 'Failed to update administrator' }, { status: 400 });
    }
  }

  static async deleteAdministrator(_req: NextRequest, id: string) {
    try {
      await AdminService.deleteAdmin(id);
      return NextResponse.json({ success: true, message: 'Administrator soft-deleted successfully' });
    } catch (error: unknown) {
      const e = error as Error;
      return NextResponse.json({ error: e.message || 'Failed to delete administrator' }, { status: 400 });
    }
  }

  static async getAdministratorOverview(_req: NextRequest, adminId: string) {
    try {
      const data = await AdminService.getAdminSessionOverview(adminId);
      return NextResponse.json(data);
    } catch (error: unknown) {
      const e = error as Error;
      return NextResponse.json({ error: e.message || 'Failed to fetch administrator overview' }, { status: 500 });
    }
  }

  static async getAdministratorAuditLogs(req: NextRequest, adminId: string) {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);

      const data = await AdminService.getAdminAuditLogs(adminId, page, pageSize);
      return NextResponse.json(data);
    } catch (error: unknown) {
      const e = error as Error;
      return NextResponse.json({ error: e.message || 'Failed to fetch administrator audit logs' }, { status: 500 });
    }
  }
}