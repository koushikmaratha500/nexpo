import { randomBytes } from 'crypto';
import { HttpError } from '../middleware/errorHandler';
import { TransactionShareRepository } from '../repositories/transaction-share.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { GroupService } from './group.service';
import { getPublicAppUrl } from '@/lib/brand/constants';
import type { CreateTransactionShareDto } from '../dtos/transaction-share.dto';

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatAmount(amount: unknown, symbol = '₹') {
  const num = typeof amount === 'object' && amount !== null && 'toString' in amount
    ? Number((amount as { toString: () => string }).toString())
    : Number(amount);
  return `${symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export class TransactionShareService {
  static async assertCanShare(userId: string, transactionId: string) {
    const transaction = await TransactionRepository.findById(transactionId, undefined, false);
    if (!transaction) {
      throw new HttpError(404, 'Transaction not found');
    }

    if (transaction.groupId) {
      await GroupService.assertMember(transaction.groupId, userId);
    } else if (transaction.userId !== userId) {
      throw new HttpError(403, 'You do not have access to this transaction');
    }

    return transaction;
  }

  static async createShare(userId: string, transactionId: string, dto: CreateTransactionShareDto) {
    await this.assertCanShare(userId, transactionId);

    const token = randomBytes(16).toString('hex');
    const expiresAt = addDays(new Date(), dto.expiresInDays ?? 7);

    const share = await TransactionShareRepository.create({
      token,
      transactionId,
      createdById: userId,
      expiresAt,
    });

    const baseUrl = getPublicAppUrl();

    return {
      id: share.id,
      token: share.token,
      url: `${baseUrl}/r/${share.token}`,
      expiresAt: share.expiresAt.toISOString(),
    };
  }

  static async getPublicReceipt(token: string) {
    const share = await TransactionShareRepository.findActiveByToken(token);
    if (!share) {
      throw new HttpError(404, 'Receipt link not found or expired');
    }

    const txn = share.transaction;
    const currencySymbol = txn.currency?.symbol || '₹';

    return {
      shareId: share.id,
      expiresAt: share.expiresAt.toISOString(),
      receipt: {
        id: txn.id,
        title: txn.title,
        merchant: txn.merchant,
        description: txn.description,
        type: txn.type,
        amount: txn.amount.toString(),
        amountFormatted: formatAmount(txn.amount, currencySymbol),
        currencyCode: txn.currency?.code || null,
        category: txn.category?.name || null,
        paymentType: txn.paymentType?.name || null,
        transactionDate: txn.transactionDate.toISOString(),
        notes: txn.notes,
        groupName: txn.group?.name || null,
        splits: txn.splits.map((split) => ({
          name: [split.user.firstName, split.user.lastName].filter(Boolean).join(' ') || 'Member',
          amount: split.computedAmount.toString(),
          amountFormatted: formatAmount(split.computedAmount, currencySymbol),
        })),
      },
      sharedBy: [share.createdBy.firstName, share.createdBy.lastName].filter(Boolean).join(' ') || 'User',
    };
  }

  static async revokeShare(userId: string, shareId: string) {
    const result = await TransactionShareRepository.revoke(shareId, userId);
    if (result.count === 0) {
      throw new HttpError(404, 'Share not found');
    }
    return { success: true };
  }

  static async listShares(userId: string, transactionId: string) {
    await this.assertCanShare(userId, transactionId);
    const shares = await TransactionShareRepository.listActiveForTransaction(transactionId, userId);
    const baseUrl = getPublicAppUrl();
    return shares.map((share) => ({
      id: share.id,
      url: `${baseUrl}/r/${share.token}`,
      expiresAt: share.expiresAt.toISOString(),
      createdAt: share.createdAt.toISOString(),
    }));
  }

  static async purgeExpiredShares() {
    return TransactionShareRepository.purgeExpired();
  }
}
