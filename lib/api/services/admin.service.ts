import { UserRepository } from '../repositories/user.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { AdminRepository } from '../repositories/admin.repository';
import { SessionRepository } from '../repositories/session.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { SupportRepository } from '../repositories/support.repository';
import { hashPassword } from './auth.service';
import { AuditAction } from '@prisma/client';
import { CreateUserDto, UpdateUserDto, CreateAdminDto, UpdateAdminDto, ResetUserPasswordDto } from '../dtos/admin.dto';

export interface RequestMeta {
  ip?: string | null;
  ua?: string | null;
}

export interface DashboardMetrics {
  userCount: number;
  totalExpenses: number;
  totalBudgets: number;
  openTicketsCount: number;
  recentExpenses: unknown[];
  recentBudgets: unknown[];
}

export interface UserOverview {
  totalExpenses: number;
  totalBudgets: number;
  expenseCount: number;
  budgetCount: number;
}

export interface UserStats {
  totalExpenses: number;
  totalBudgets: number;
  expenseCount: number;
  budgetCount: number;
  sessionCount: number;
}

export interface AdminSessionOverview {
  recentSessions: unknown[];
  activeSessions: number;
}

export class AdminService {
  static async getDashboard(): Promise<DashboardMetrics> {
    const [
      userCount,
      expenseSum,
      budgetSum,
      ticketCount,
      recentExpenses,
      recentBudgets,
    ] = await Promise.all([
      UserRepository.countActive(),
      TransactionRepository.aggregateByType('DEBIT'),
      TransactionRepository.aggregateByType('CREDIT'),
      SupportRepository.countActive(),
      TransactionRepository.findRecentByType('DEBIT', 5),
      TransactionRepository.findRecentByType('CREDIT', 5),
    ]);

    return {
      userCount,
      totalExpenses: Number(expenseSum._sum.amount || 0),
      totalBudgets: Number(budgetSum._sum.amount || 0),
      openTicketsCount: ticketCount,
      recentExpenses,
      recentBudgets,
    };
  }

  static async getReports(params: {
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }): Promise<{
    expenses: { items: unknown[]; total: number };
    budgets: { items: unknown[]; total: number };
  }> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 100;

    const [expenses, budgets, totalExpensesCount, totalBudgetsCount] =
      await Promise.all([
        TransactionRepository.findAll({
          type: 'DEBIT',
          startDate: params.startDate,
          endDate: params.endDate,
          page,
          pageSize,
        }),
        TransactionRepository.findAll({
          type: 'CREDIT',
          startDate: params.startDate,
          endDate: params.endDate,
          page,
          pageSize,
        }),
        TransactionRepository.countByType('DEBIT'),
        TransactionRepository.countByType('CREDIT'),
      ]);

    return {
      expenses: { items: expenses.items, total: totalExpensesCount },
      budgets: { items: budgets.items, total: totalBudgetsCount },
    };
  }

  static async getUserWithStats(id: string) {
    const user = await UserRepository.findById(id);
    if (!user) {
      return null;
    }

    const [
      expenseSum,
      budgetSum,
      expenseCount,
      budgetCount,
      sessionCount,
    ] = await Promise.all([
      TransactionRepository.aggregateByType('DEBIT', { userId: id }),
      TransactionRepository.aggregateByType('CREDIT', { userId: id }),
      TransactionRepository.countByType('DEBIT', { userId: id }),
      TransactionRepository.countByType('CREDIT', { userId: id }),
      SessionRepository.countByUserId(id),
    ]);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName || '',
        email: user.email || '',
        mobile: user.mobile || '',
        status: user.status,
        emailVerified: user.emailVerified,
        mobileVerified: user.mobileVerified,
        forcedResetPassword: user.forcedResetPassword,
        lastPasswordChangedDate: user.lastPasswordChangedDate,
        profileImageUrl: user.profileImageUrl || null,
        country: user.country || null,
        currency: user.currency || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      stats: {
        totalExpenses: Number(expenseSum._sum.amount || 0),
        totalBudgets: Number(budgetSum._sum.amount || 0),
        expenseCount,
        budgetCount,
        sessionCount,
      },
    };
  }

  static async getUserOverview(userId: string): Promise<UserOverview> {
    const [
      expenseSum,
      budgetSum,
      expenseCount,
      budgetCount,
    ] = await Promise.all([
      TransactionRepository.aggregateByType('DEBIT', { userId }),
      TransactionRepository.aggregateByType('CREDIT', { userId }),
      TransactionRepository.countByType('DEBIT', { userId }),
      TransactionRepository.countByType('CREDIT', { userId }),
    ]);

    return {
      totalExpenses: Number(expenseSum._sum.amount || 0),
      totalBudgets: Number(budgetSum._sum.amount || 0),
      expenseCount,
      budgetCount,
    };
  }

  static async getUserAuditLogs(
    userId: string,
    page = 1,
    pageSize = 100,
  ): Promise<{ items: unknown[]; total: number }> {
    const [userAudits, transactionAudits, userAuditTotal, transactionAuditTotal] =
      await Promise.all([
        AuditLogRepository.getUserAudits(userId, page, pageSize),
        AuditLogRepository.getTransactionAudits(userId, page, pageSize),
        AuditLogRepository.getUserAuditsCount(userId),
        AuditLogRepository.getTransactionAuditsCount(userId),
      ]);

    const combinedItems = [...userAudits.items, ...transactionAudits.items]
      .sort(
        (a: { createdAt: string | Date }, b: { createdAt: string | Date }) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, pageSize);

    return {
      items: combinedItems,
      total: userAuditTotal + transactionAuditTotal,
    };
  }

  static async createUser(dto: CreateUserDto, meta: RequestMeta = {}) {
    const existing = await UserRepository.findByEmail(dto.email);
    if (existing) {
      throw new Error('Email is already registered');
    }

    const hashedPassword = hashPassword(dto.password);
    const user = await UserRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName || null,
      email: dto.email,
      passwordHash: hashedPassword,
      mobile: dto.mobile || null,
      countryId: dto.countryId || null,
      currencyId: dto.currencyId || null,
      emailVerified: true,
    });

    await UserRepository.createAudit({
      userId: user.id,
      action: AuditAction.CREATE,
      newValue: { email: user.email, firstName: user.firstName, status: user.status },
      ipAddress: meta.ip || null,
      userAgent: meta.ua || null,
      status: 'A',
    });

    return user;
  }

  static async updateUser(id: string, dto: UpdateUserDto, meta: RequestMeta = {}) {
    const updateData: Record<string, unknown> = { ...dto };
    if (dto.password) {
      updateData.passwordHash = hashPassword(dto.password);
      delete updateData.password;
    }

    const original = await UserRepository.findById(id);
    if (!original) {
      throw new Error('User not found');
    }

    // Reject soft-deleted users
    if (original.status === 'D') {
      throw new Error('User not found');
    }

    const updated = await UserRepository.update(id, updateData);

    // Blocking must take effect immediately: invalidate all active sessions.
    if (updateData.status === 'B') {
      await SessionRepository.invalidateAllForUser(id);
    }

    const action =
      updateData.status === 'B'
        ? AuditAction.BLOCK
        : updateData.status && updateData.status === 'A' && original.status !== 'A'
          ? AuditAction.ACTIVATE
          : AuditAction.UPDATE;

    await UserRepository.createAudit({
      userId: id,
      action,
      oldValue: { firstName: original.firstName, lastName: original.lastName, status: original.status },
      newValue: { firstName: updated.firstName, lastName: updated.lastName, status: updated.status },
      ipAddress: meta.ip || null,
      userAgent: meta.ua || null,
      status: 'A',
    });

    return updated;
  }

  static async blockUser(id: string, meta: RequestMeta = {}) {
    const original = await UserRepository.findById(id);
    if (!original) {
      throw new Error('User not found');
    }
    if (original.status === 'D') {
      throw new Error('User not found');
    }
    if (original.status === 'B') {
      throw new Error('Account is already blocked');
    }

    const updated = await UserRepository.update(id, { status: 'B' });

    // Blocking takes effect immediately: invalidate all active sessions.
    await SessionRepository.invalidateAllForUser(id);

    await UserRepository.createAudit({
      userId: id,
      action: AuditAction.BLOCK,
      oldValue: { email: original.email, status: original.status },
      newValue: { email: updated.email, status: updated.status, note: 'Account blocked by admin' },
      ipAddress: meta.ip || null,
      userAgent: meta.ua || null,
      status: 'A',
    });

    return { user: updated, message: 'Account blocked successfully' };
  }

  static async activateUser(id: string, meta: RequestMeta = {}) {
    const original = await UserRepository.findById(id);
    if (!original) {
      throw new Error('User not found');
    }
    if (original.status === 'D') {
      throw new Error('User not found');
    }
    if (original.status === 'A') {
      throw new Error('Account is already active');
    }

    // Forced activation bypasses the OTP verification step.
    const updated = await UserRepository.update(id, { status: 'A', emailVerified: true });

    await UserRepository.createAudit({
      userId: id,
      action: AuditAction.ACTIVATE,
      oldValue: { email: original.email, status: original.status, emailVerified: original.emailVerified },
      newValue: { email: updated.email, status: updated.status, emailVerified: true, note: 'Account force-activated by admin' },
      ipAddress: meta.ip || null,
      userAgent: meta.ua || null,
      status: 'A',
    });

    return { user: updated, message: 'Account activated successfully' };
  }

  static async deleteUser(id: string, meta: RequestMeta = {}) {
    const original = await UserRepository.findById(id);
    if (!original) {
      throw new Error('User not found');
    }

    await UserRepository.softDelete(id);

    await UserRepository.createAudit({
      userId: id,
      action: AuditAction.DELETE,
      oldValue: { email: original.email, firstName: original.firstName, status: original.status },
      ipAddress: meta.ip || null,
      userAgent: meta.ua || null,
      status: 'A',
    });

    return { success: true, message: 'User soft-deleted successfully' };
  }

  static async resetUserPassword(id: string, dto: ResetUserPasswordDto, meta: RequestMeta = {}) {
    const original = await UserRepository.findById(id);
    if (!original) {
      throw new Error('User not found');
    }

    const hashedPassword = hashPassword(dto.password);
    const updated = await UserRepository.update(id, {
      passwordHash: hashedPassword,
      forcedResetPassword: dto.forcedResetPassword,
      lastPasswordChangedDate: new Date(),
    });

    await SessionRepository.invalidateAllForUser(id);

    await UserRepository.createAudit({
      userId: id,
      action: AuditAction.PASSWORD_RESET,
      oldValue: {
        email: original.email,
        forcedResetPassword: original.forcedResetPassword,
        lastPasswordChangedDate: original.lastPasswordChangedDate,
      },
      newValue: {
        email: updated.email,
        forcedResetPassword: updated.forcedResetPassword,
        lastPasswordChangedDate: updated.lastPasswordChangedDate,
      },
      ipAddress: meta.ip || null,
      userAgent: meta.ua || null,
      status: 'A',
    });

    return updated;
  }

  static async createAdmin(dto: CreateAdminDto) {
    const existing = await AdminRepository.findByEmail(dto.email);
    if (existing) {
      throw new Error('Email is already registered');
    }

    const hashedPassword = hashPassword(dto.password);
    return AdminRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName || null,
      email: dto.email,
      passwordHash: hashedPassword,
    });
  }

  static async updateAdmin(id: string, dto: UpdateAdminDto) {
    const updateData: Record<string, unknown> = { ...dto };
    if (dto.password) {
      updateData.passwordHash = hashPassword(dto.password);
      delete updateData.password;
    }

    return AdminRepository.update(id, updateData);
  }

  static async deleteAdmin(id: string) {
    return AdminRepository.softDelete(id);
  }

  static async getAdminSessionOverview(adminId: string): Promise<AdminSessionOverview> {
    const [recentSessions, activeSessions] = await Promise.all([
      SessionRepository.findByAdmin(adminId, 5),
      SessionRepository.countActiveByAdmin(adminId),
    ]);

    return {
      recentSessions,
      activeSessions,
    };
  }

  static async getAdminAuditLogs(adminId: string, page = 1, pageSize = 100) {
    return AuditLogRepository.getSupportTicketAudits(adminId, page, pageSize);
  }
}
