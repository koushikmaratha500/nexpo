import { randomUUID } from 'crypto';
import { AuditAction } from '@prisma/client';
import { accountLifecyclePurgeAt } from '../domain/account-lifecycle';
import type { AccountLifecycleActionDto } from '../dtos/account-lifecycle.dto';
import { AccountLifecycleRepository } from '../repositories/account-lifecycle.repository';
import { SessionRepository } from '../repositories/session.repository';
import { UserRepository } from '../repositories/user.repository';
import { AccountLifecycleOtpService } from './account-lifecycle-otp.service';

export class AccountLifecycleService {
  static async getStatus(userId: string) {
    const user = await AccountLifecycleRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return AccountLifecycleRepository.serializeLifecycle(user);
  }

  private static async assertActionAuthorized(
    userId: string,
    input: AccountLifecycleActionDto,
  ) {
    const user = await AccountLifecycleRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await AccountLifecycleOtpService.verifyOtp({
      userId,
      action: input.confirmation,
      channel: input.channel,
      otp: input.otp,
    });

    return user;
  }

  static async requestReset(
    userId: string,
    input: AccountLifecycleActionDto,
    meta: { ip?: string; ua?: string } = {},
  ) {
    if (input.confirmation !== 'RESET') {
      throw new Error('Confirmation must be RESET');
    }

    const user = await this.assertActionAuthorized(userId, input);
    if (user.accountLifecycleMode === 'DELETE_PENDING') {
      throw new Error('Account is scheduled for deletion. Restore the account before resetting.');
    }

    const now = new Date();
    const batchId = randomUUID();

    if (user.accountLifecycleMode === 'RESET_PENDING' && user.accountLifecycleBatchId) {
      await AccountLifecycleRepository.hardDeleteResetBatch(userId, user.accountLifecycleBatchId);
    }

    const hiddenCount = await AccountLifecycleRepository.markPersonalTransactionsForReset(
      userId,
      batchId,
    );
    await AccountLifecycleRepository.clearPersonalImportArtifacts(userId);

    const updated = await AccountLifecycleRepository.updateUserLifecycle(userId, {
      accountLifecycleMode: 'RESET_PENDING',
      accountLifecycleAt: now,
      accountLifecyclePurgeAt: accountLifecyclePurgeAt(now),
      accountLifecycleBatchId: batchId,
    });

    await UserRepository.createAudit({
      userId,
      action: AuditAction.UPDATE,
      newValue: {
        action: 'account_reset_requested',
        hidden_transactions: hiddenCount,
        purge_at: updated.accountLifecyclePurgeAt?.toISOString(),
      },
      ipAddress: meta.ip || null,
      userAgent: meta.ua || null,
      status: 'A',
    });

    return {
      lifecycle: AccountLifecycleRepository.serializeLifecycle(updated),
      hidden_transactions: hiddenCount,
    };
  }

  static async requestDelete(
    userId: string,
    input: AccountLifecycleActionDto,
    meta: { ip?: string; ua?: string } = {},
  ) {
    if (input.confirmation !== 'DELETE') {
      throw new Error('Confirmation must be DELETE');
    }

    const user = await this.assertActionAuthorized(userId, input);
    const now = new Date();

    const updated = await AccountLifecycleRepository.updateUserLifecycle(userId, {
      accountLifecycleMode: 'DELETE_PENDING',
      accountLifecycleAt: now,
      accountLifecyclePurgeAt: accountLifecyclePurgeAt(now),
      accountLifecycleBatchId: null,
    });

    await SessionRepository.invalidateAllForUser(userId);

    await UserRepository.createAudit({
      userId,
      action: AuditAction.UPDATE,
      newValue: {
        action: 'account_delete_requested',
        purge_at: updated.accountLifecyclePurgeAt?.toISOString(),
      },
      ipAddress: meta.ip || null,
      userAgent: meta.ua || null,
      status: 'A',
    });

    return {
      lifecycle: AccountLifecycleRepository.serializeLifecycle(updated),
      logged_out: true,
    };
  }

  static async restore(userId: string, meta: { ip?: string; ua?: string } = {}) {
    const user = await AccountLifecycleRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.accountLifecycleMode === 'ACTIVE') {
      return { lifecycle: AccountLifecycleRepository.serializeLifecycle(user), restored: false };
    }

    const purgeAt = user.accountLifecyclePurgeAt;
    if (!purgeAt || purgeAt.getTime() <= Date.now()) {
      throw new Error('Retention window has expired');
    }

    if (user.accountLifecycleMode === 'RESET_PENDING' && user.accountLifecycleBatchId) {
      await AccountLifecycleRepository.restoreResetBatch(userId, user.accountLifecycleBatchId);
    }

    const updated = await AccountLifecycleRepository.clearLifecycleFields(userId);

    await UserRepository.createAudit({
      userId,
      action: AuditAction.UPDATE,
      newValue: { action: 'account_lifecycle_restored', previous_mode: user.accountLifecycleMode },
      ipAddress: meta.ip || null,
      userAgent: meta.ua || null,
      status: 'A',
    });

    return {
      lifecycle: AccountLifecycleRepository.serializeLifecycle(updated),
      restored: true,
    };
  }

  static async recoverOnLogin(userId: string, meta: { ip?: string; ua?: string } = {}) {
    const user = await AccountLifecycleRepository.findUserById(userId);
    if (!user || user.accountLifecycleMode === 'ACTIVE') {
      return { restored: false as const };
    }

    const purgeAt = user.accountLifecyclePurgeAt;
    if (!purgeAt || purgeAt.getTime() <= Date.now()) {
      return { restored: false as const };
    }

    const result = await this.restore(userId, meta);
    return { restored: result.restored, lifecycle: result.lifecycle };
  }

  static async purgeDueAccounts() {
    const now = new Date();
    const due = await AccountLifecycleRepository.listDueForPurge(now);

    let resetPurged = 0;
    let accountsDeleted = 0;

    for (const row of due) {
      if (row.accountLifecycleMode === 'RESET_PENDING' && row.accountLifecycleBatchId) {
        await AccountLifecycleRepository.hardDeleteResetBatch(row.id, row.accountLifecycleBatchId);
        await AccountLifecycleRepository.clearPersonalImportArtifacts(row.id);
        await AccountLifecycleRepository.clearLifecycleFields(row.id);
        resetPurged += 1;
        continue;
      }

      if (row.accountLifecycleMode === 'DELETE_PENDING') {
        await AccountLifecycleRepository.hardDeleteUser(row.id);
        accountsDeleted += 1;
      }
    }

    return { resetPurged, accountsDeleted, checked: due.length };
  }
}
