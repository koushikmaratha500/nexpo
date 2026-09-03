import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { GroupTransactionService } from '../services/group-transaction.service';
import {
  createGroupTransactionSchema,
  updateGroupTransactionSchema,
  groupTransactionListQuerySchema,
} from '../dtos/group-transaction.dto';

export class GroupTransactionController extends BaseController {
  static async list(req: NextRequest, groupId: string, userId: string) {
    return this.safeExecuteJson(async () => {
      const { searchParams } = new URL(req.url);
      const query = groupTransactionListQuerySchema.parse({
        type: searchParams.get('type') ?? undefined,
        page: searchParams.get('page') ?? undefined,
        pageSize: searchParams.get('pageSize') ?? undefined,
      });
      return GroupTransactionService.listTransactions(groupId, userId, query);
    }, { fallbackMessage: 'Failed to fetch group transactions' });
  }

  static async create(req: NextRequest, groupId: string, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = createGroupTransactionSchema.parse(body);
      const meta = this.requestMeta(req);
      return GroupTransactionService.createTransaction(groupId, userId, validated, meta);
    }, { status: 201, fallbackMessage: 'Failed to create group transaction' });
  }

  static async createFromParsed(body: Record<string, unknown>, groupId: string, userId: string, req: NextRequest) {
    return this.safeExecuteJson(async () => {
      if (typeof body.split === 'string') {
        body.split = JSON.parse(body.split);
      }
      const validated = createGroupTransactionSchema.parse(body);
      const meta = this.requestMeta(req);
      return GroupTransactionService.createTransaction(groupId, userId, validated, meta);
    }, { status: 201, fallbackMessage: 'Failed to create group transaction' });
  }

  static async update(req: NextRequest, groupId: string, transactionId: string, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = updateGroupTransactionSchema.parse(body);
      const meta = this.requestMeta(req);
      return GroupTransactionService.updateTransaction(groupId, transactionId, userId, validated, meta);
    }, { fallbackMessage: 'Failed to update group transaction' });
  }

  static async updateFromParsed(
    body: Record<string, unknown>,
    groupId: string,
    transactionId: string,
    userId: string,
    req: NextRequest,
  ) {
    return this.safeExecuteJson(async () => {
      if (typeof body.split === 'string') {
        body.split = JSON.parse(body.split);
      }
      const validated = updateGroupTransactionSchema.parse(body);
      const meta = this.requestMeta(req);
      return GroupTransactionService.updateTransaction(groupId, transactionId, userId, validated, meta);
    }, { fallbackMessage: 'Failed to update group transaction' });
  }

  static async delete(_req: NextRequest, groupId: string, transactionId: string, userId: string) {
    return this.safeExecuteJson(async () => {
      const meta = this.requestMeta(_req);
      return GroupTransactionService.deleteTransaction(groupId, transactionId, userId, meta);
    }, { fallbackMessage: 'Failed to delete group transaction' });
  }

  static async balances(_req: NextRequest, groupId: string, userId: string) {
    return this.safeExecuteJson(async () => GroupTransactionService.getBalances(groupId, userId), {
      fallbackMessage: 'Failed to fetch group balances',
    });
  }
}
