import { NextRequest } from 'next/server';
import { HttpError } from '../middleware/errorHandler';
import { BaseController } from './base.controller';
import { AdminService } from '../services/admin.service';
import { UserRepository } from '../repositories/user.repository';
import { AdminRepository } from '../repositories/admin.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import {
  createUserSchema,
  updateUserSchema,
  createAdminSchema,
  updateAdminSchema,
  resetUserPasswordSchema,
} from '../dtos/admin.dto';

export class AdminController extends BaseController {
  static async getDashboard(_req: NextRequest) {
    return this.safeExecuteJson(
      async () => AdminService.getDashboard(),
      { fallbackMessage: 'Failed to fetch dashboard metrics' },
    );
  }

  static async getReports(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const { searchParams } = new URL(req.url);
      const startDateStr = searchParams.get('startDate');
      const endDateStr = searchParams.get('endDate');
      return AdminService.getReports({
        startDate: startDateStr ? new Date(startDateStr) : undefined,
        endDate: endDateStr ? new Date(endDateStr) : undefined,
      });
    }, { fallbackMessage: 'Failed to fetch reports' });
  }

  static async getUser(_req: NextRequest, id: string) {
    return this.safeExecuteJson(async () => {
      const data = await AdminService.getUserWithStats(id);
      if (!data) throw new HttpError(404, 'User not found');
      return data;
    }, { fallbackMessage: 'Failed to fetch user' });
  }

  static async getUsers(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const { searchParams } = new URL(req.url);
      return UserRepository.findAll(
        parseInt(searchParams.get('page') || '1', 10),
        parseInt(searchParams.get('pageSize') || '100', 10),
      );
    }, { fallbackMessage: 'Failed to fetch users' });
  }

  static async createUser(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = createUserSchema.parse(body);
      return AdminService.createUser(validated, {
        ip: req.headers.get('x-forwarded-for') || null,
        ua: req.headers.get('user-agent') || null,
      });
    }, { status: 201, fallbackMessage: 'Failed to create user' });
  }

  static async updateUser(req: NextRequest, id: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = updateUserSchema.parse(body);
      return AdminService.updateUser(id, validated, {
        ip: req.headers.get('x-forwarded-for') || null,
        ua: req.headers.get('user-agent') || null,
      });
    }, { fallbackMessage: 'Failed to update user' });
  }

  static async deleteUser(req: NextRequest, id: string) {
    return this.safeExecuteJson(
      async () =>
        AdminService.deleteUser(id, {
          ip: req.headers.get('x-forwarded-for') || null,
          ua: req.headers.get('user-agent') || null,
        }),
      { fallbackMessage: 'Failed to delete user' },
    );
  }

  static async blockUser(req: NextRequest, id: string) {
    return this.safeExecuteJson(
      async () =>
        AdminService.blockUser(id, {
          ip: req.headers.get('x-forwarded-for') || null,
          ua: req.headers.get('user-agent') || null,
        }),
      { fallbackMessage: 'Failed to block user' },
    );
  }

  static async activateUser(req: NextRequest, id: string) {
    return this.safeExecuteJson(
      async () =>
        AdminService.activateUser(id, {
          ip: req.headers.get('x-forwarded-for') || null,
          ua: req.headers.get('user-agent') || null,
        }),
      { fallbackMessage: 'Failed to activate user' },
    );
  }

  static async resetUserPassword(req: NextRequest, id: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = resetUserPasswordSchema.parse(body);
      const updated = await AdminService.resetUserPassword(id, validated, {
        ip: req.headers.get('x-forwarded-for') || null,
        ua: req.headers.get('user-agent') || null,
      });
      return {
        success: true,
        message: 'Password reset successfully',
        user: {
          id: updated.id,
          forcedResetPassword: updated.forcedResetPassword,
          lastPasswordChangedDate: updated.lastPasswordChangedDate,
        },
      };
    }, { fallbackMessage: 'Failed to reset password' });
  }

  static async getUserExpenses(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '100', 10));
      const result = await TransactionRepository.findAll({ userId, type: 'DEBIT', page, pageSize });
      return {
        items: TransactionRepository.serializeItems(result.items as unknown as Record<string, unknown>[]),
        total: result.total,
      };
    }, { fallbackMessage: 'Failed to fetch user expenses' });
  }

  static async getUserBudget(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '100', 10));
      const result = await TransactionRepository.findAll({ userId, type: 'CREDIT', page, pageSize });
      return {
        items: TransactionRepository.serializeItems(result.items as unknown as Record<string, unknown>[]),
        total: result.total,
      };
    }, { fallbackMessage: 'Failed to fetch user budgets' });
  }

  static async getUserOverview(_req: NextRequest, userId: string) {
    return this.safeExecuteJson(
      async () => AdminService.getUserOverview(userId),
      { fallbackMessage: 'Failed to fetch user overview' },
    );
  }

  static async getUserAuditLogs(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const { searchParams } = new URL(req.url);
      return AdminService.getUserAuditLogs(
        userId,
        parseInt(searchParams.get('page') || '1', 10),
        parseInt(searchParams.get('pageSize') || '100', 10),
      );
    }, { fallbackMessage: 'Failed to fetch user audit logs' });
  }

  static async getAdministrators(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const { searchParams } = new URL(req.url);
      return AdminRepository.findAll(
        parseInt(searchParams.get('page') || '1', 10),
        parseInt(searchParams.get('pageSize') || '100', 10),
      );
    }, { fallbackMessage: 'Failed to fetch administrators' });
  }

  static async createAdministrator(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = createAdminSchema.parse(body);
      return AdminService.createAdmin(validated);
    }, { status: 201, fallbackMessage: 'Failed to create administrator' });
  }

  static async updateAdministrator(req: NextRequest, id: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = updateAdminSchema.parse(body);
      return AdminService.updateAdmin(id, validated);
    }, { fallbackMessage: 'Failed to update administrator' });
  }

  static async deleteAdministrator(_req: NextRequest, id: string) {
    return this.safeExecuteJson(async () => {
      await AdminService.deleteAdmin(id);
      return { success: true, message: 'Administrator soft-deleted successfully' };
    }, { fallbackMessage: 'Failed to delete administrator' });
  }

  static async getAdministratorOverview(_req: NextRequest, adminId: string) {
    return this.safeExecuteJson(
      async () => AdminService.getAdminSessionOverview(adminId),
      { fallbackMessage: 'Failed to fetch administrator overview' },
    );
  }

  static async getAdministratorAuditLogs(req: NextRequest, adminId: string) {
    return this.safeExecuteJson(async () => {
      const { searchParams } = new URL(req.url);
      return AdminService.getAdminAuditLogs(
        adminId,
        parseInt(searchParams.get('page') || '1', 10),
        parseInt(searchParams.get('pageSize') || '100', 10),
      );
    }, { fallbackMessage: 'Failed to fetch administrator audit logs' });
  }
}
