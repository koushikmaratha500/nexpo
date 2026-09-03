import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { TransactionShareService } from '../services/transaction-share.service';
import { createTransactionShareSchema } from '../dtos/transaction-share.dto';

export class TransactionShareController extends BaseController {
  static async create(req: NextRequest, transactionId: string, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json().catch(() => ({}));
      const validated = createTransactionShareSchema.parse(body);
      return TransactionShareService.createShare(userId, transactionId, validated);
    }, { status: 201, fallbackMessage: 'Failed to create share link' });
  }

  static async getPublic(_req: NextRequest, token: string) {
    return this.safeExecuteJson(
      async () => TransactionShareService.getPublicReceipt(token),
      { errorStatus: 404, fallbackMessage: 'Receipt not found' },
    );
  }

  static async revoke(_req: NextRequest, shareId: string, userId: string) {
    return this.safeExecuteJson(
      async () => TransactionShareService.revokeShare(userId, shareId),
      { fallbackMessage: 'Failed to revoke share link' },
    );
  }

  static async listForTransaction(_req: NextRequest, transactionId: string, userId: string) {
    return this.safeExecuteJson(
      async () => TransactionShareService.listShares(userId, transactionId),
      { fallbackMessage: 'Failed to list share links' },
    );
  }
}
