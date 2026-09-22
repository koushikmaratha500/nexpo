import type { Prisma } from '@prisma/client';
import { HttpError } from '../middleware/errorHandler';
import { TransactionService } from './transaction.service';
import { ReportService } from './report.service';
import { BotRequestRepository } from '../repositories/bot-request.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { toPrismaBotChannel } from '@/lib/bot/channel';
import { formatDateLabel, parseTransactionDate, resolveDateRange } from '@/lib/bot/dateRanges';
import { mapTransaction, toYmd } from '@/lib/ai/aggregates';
import type { AiParseResult, BotCommandRequest } from '../dtos/bot.dto';
import { PLAN_ERROR_CODES } from '@/lib/billing/types';

export interface BotDisplayFields {
  amount?: string;
  category?: string;
  description?: string;
  merchant?: string;
  date_label?: string;
  total_spend?: number;
  total_income?: number;
  transaction_count?: number;
  top_categories?: Array<{ name: string; amount: number }>;
  total_amount?: number;
  items?: Array<{ amount: string; title: string; date: string }>;
}

export interface BotCommandResult {
  success: boolean;
  type?: string;
  transaction_id?: string;
  message?: string;
  error_code?: string;
  display?: BotDisplayFields;
}

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function toStoredResult(result: BotCommandResult): Prisma.InputJsonValue {
  return result as unknown as Prisma.InputJsonValue;
}

function mapPlanError(error: unknown): BotCommandResult | null {
  if (error instanceof HttpError && error.status === 402) {
    const code = (error.extra?.code as string) || PLAN_ERROR_CODES.WRITE_LOCKED;
    return {
      success: false,
      error_code: code === PLAN_ERROR_CODES.LIMIT ? 'PLAN_LIMIT' : 'PLAN_WRITE_LOCKED',
      message: error.message,
    };
  }
  return null;
}

export class BotCommandService {
  static async execute(request: BotCommandRequest): Promise<BotCommandResult> {
    const channel = toPrismaBotChannel(request.source_channel);
    const existing = await BotRequestRepository.findByIdempotencyKey(request.idempotency_key);

    if (existing?.status === 'COMPLETED' && existing.result) {
      const cached = existing.result as unknown as BotCommandResult;
      return {
        ...cached,
        success: true,
        error_code: 'DUPLICATE',
        message: 'Already processed',
      };
    }

    const botRequest =
      existing ??
      (await BotRequestRepository.create({
        idempotencyKey: request.idempotency_key,
        channel,
        externalMessageId: request.idempotency_key,
        userId: request.user_id,
        command: request.command,
        payload: request.payload,
      }));

    try {
      const result = await this.dispatch(request);
      await BotRequestRepository.updateStatus(botRequest.id, 'COMPLETED', toStoredResult(result));
      return result;
    } catch (error) {
      const planResult = mapPlanError(error);
      if (planResult) {
        await BotRequestRepository.updateStatus(
          botRequest.id,
          'FAILED',
          toStoredResult(planResult),
          planResult.message,
        );
        return planResult;
      }
      const message = error instanceof Error ? error.message : 'Command failed';
      await BotRequestRepository.updateStatus(botRequest.id, 'FAILED', undefined, message);
      throw error;
    }
  }

  static async executeFromAiParse(params: {
    userId: string;
    channel: string;
    idempotencyKey: string;
    aiParse: AiParseResult;
  }): Promise<BotCommandResult> {
    const { aiParse } = params;

    if (aiParse.intent === 'UNKNOWN') {
      return {
        success: false,
        type: 'clarification',
        message: aiParse.clarification_question || 'Could you provide more details?',
      };
    }

    if (aiParse.intent === 'HELP') {
      return { success: true, type: 'help' };
    }

    const command = this.intentToCommand(aiParse.intent);
    if (!command) {
      return {
        success: false,
        type: 'clarification',
        message: `Command "${aiParse.intent}" is not supported yet.`,
      };
    }

    return this.execute({
      command,
      user_id: params.userId,
      idempotency_key: params.idempotencyKey,
      source_channel: params.channel as 'whatsapp' | 'telegram',
      correlation_id: params.idempotencyKey,
      payload: this.aiParseToPayload(aiParse),
    });
  }

  private static intentToCommand(intent: string): BotCommandRequest['command'] | null {
    const map: Record<string, BotCommandRequest['command']> = {
      CREATE_EXPENSE: 'CREATE_EXPENSE',
      CREATE_INCOME: 'CREATE_INCOME',
      GET_DAILY_SUMMARY: 'GET_DAILY_SUMMARY',
      GET_WEEKLY_SUMMARY: 'GET_WEEKLY_SUMMARY',
      GET_MONTHLY_SUMMARY: 'GET_MONTHLY_SUMMARY',
      GET_CATEGORY_SUMMARY: 'GET_CATEGORY_SUMMARY',
      GET_TRANSACTIONS: 'GET_TRANSACTIONS',
      DELETE_LAST_TRANSACTION: 'DELETE_LAST_TRANSACTION',
      UPDATE_LAST_TRANSACTION: 'UPDATE_LAST_TRANSACTION',
      HELP: 'HELP',
    };
    return map[intent] ?? null;
  }

  private static aiParseToPayload(aiParse: AiParseResult): BotCommandRequest['payload'] {
    return {
      amount: aiParse.amount ?? undefined,
      currency: aiParse.currency ?? undefined,
      category: aiParse.category ?? undefined,
      categoryName: aiParse.category ?? undefined,
      description: aiParse.description ?? undefined,
      merchant: aiParse.merchant ?? undefined,
      transaction_date: aiParse.transaction_date ?? undefined,
      limit: aiParse.query?.limit ?? undefined,
      period: aiParse.query?.period ?? undefined,
    };
  }

  private static async dispatch(request: BotCommandRequest): Promise<BotCommandResult> {
    const { command, user_id: userId, payload = {} } = request;

    switch (command) {
      case 'CREATE_EXPENSE':
        return this.createTransaction(userId, 'DEBIT', payload);
      case 'CREATE_INCOME':
        return this.createTransaction(userId, 'CREDIT', payload);
      case 'GET_DAILY_SUMMARY':
        return this.getSummary(userId, resolveDateRange('today'));
      case 'GET_WEEKLY_SUMMARY':
        return this.getSummary(userId, resolveDateRange('this_week'), 'weekly_summary');
      case 'GET_MONTHLY_SUMMARY':
        return this.getSummary(userId, resolveDateRange('this_month'), 'monthly_summary');
      case 'GET_CATEGORY_SUMMARY':
        return this.getCategorySummary(userId, payload);
      case 'GET_TRANSACTIONS':
        return this.getTransactions(userId, payload);
      case 'DELETE_LAST_TRANSACTION':
        return this.deleteLastTransaction(userId, 'DEBIT');
      case 'UPDATE_LAST_TRANSACTION':
        return this.updateLastTransaction(userId, payload);
      case 'HELP':
        return { success: true, type: 'help' };
      default:
        return { success: false, message: `Unsupported command: ${command}` };
    }
  }

  private static async createTransaction(
    userId: string,
    type: 'DEBIT' | 'CREDIT',
    payload: BotCommandRequest['payload'],
  ): Promise<BotCommandResult> {
    if (!payload?.amount || payload.amount <= 0) {
      return {
        success: false,
        type: 'clarification',
        message: 'How much was the transaction?',
      };
    }

    const transaction = await TransactionService.createTransaction(userId, {
      type,
      amount: payload.amount,
      title: payload.description || payload.merchant || (type === 'DEBIT' ? 'Expense' : 'Income'),
      description: payload.description,
      merchant: payload.merchant,
      categoryName: payload.category || payload.categoryName,
      transactionDate: parseTransactionDate(
        payload.transaction_date || payload.transactionDate || new Date(),
      ),
      isRecurring: false,
    });

    const amount = Number(TransactionRepository.serializeAmount(transaction as unknown as Record<string, unknown>));
    const categoryName = payload.category || payload.categoryName || 'Other';

    return {
      success: true,
      type: type === 'DEBIT' ? 'expense_created' : 'income_created',
      transaction_id: transaction.id,
      display: {
        amount: formatInr(amount),
        category: categoryName,
        description: transaction.description || transaction.title,
        merchant: transaction.merchant ?? undefined,
        date_label: formatDateLabel(transaction.transactionDate),
      },
    };
  }

  private static async getSummary(
    userId: string,
    range: ReturnType<typeof resolveDateRange>,
    type: 'daily_summary' | 'weekly_summary' | 'monthly_summary' = 'daily_summary',
  ): Promise<BotCommandResult> {
    const [debitReport, creditReport] = await Promise.all([
      ReportService.getCustomerReport(userId, {
        startDate: toYmd(range.startDate),
        endDate: toYmd(range.endDate),
        type: 'DEBIT',
        page: 1,
        pageSize: 1,
      }),
      ReportService.getCustomerReport(userId, {
        startDate: toYmd(range.startDate),
        endDate: toYmd(range.endDate),
        type: 'CREDIT',
        page: 1,
        pageSize: 1,
      }),
    ]);

    const topCategories = debitReport.categoryBreakdown.slice(0, 5).map((c) => ({
      name: c.categoryName,
      amount: c.totalAmount,
    }));

    return {
      success: true,
      type,
      display: {
        total_spend: debitReport.totalAmount,
        total_income: creditReport.totalAmount,
        transaction_count: debitReport.total + creditReport.total,
        top_categories: topCategories,
      },
    };
  }

  private static async getCategorySummary(
    userId: string,
    payload: BotCommandRequest['payload'],
  ): Promise<BotCommandResult> {
    const period = payload?.period || 'this_month';
    const range = resolveDateRange(period);
    const categoryName = payload?.category || payload?.categoryName || 'Other';

    const report = await ReportService.getCustomerReport(userId, {
      startDate: toYmd(range.startDate),
      endDate: toYmd(range.endDate),
      type: 'DEBIT',
      page: 1,
      pageSize: 50,
    });

    const match = report.categoryBreakdown.find(
      (c) => c.categoryName.toLowerCase() === categoryName.toLowerCase(),
    );

    return {
      success: true,
      type: 'category_summary',
      display: {
        category: categoryName,
        total_amount: match?.totalAmount ?? 0,
        transaction_count: match?.count ?? 0,
      },
    };
  }

  private static async getTransactions(
    userId: string,
    payload: BotCommandRequest['payload'],
  ): Promise<BotCommandResult> {
    const limit = payload?.limit ?? 10;
    const range = resolveDateRange(payload?.period || 'this_month');

    const result = await TransactionService.getTransactions({
      userId,
      groupId: null,
      startDate: range.startDate,
      endDate: range.endDate,
      page: 1,
      pageSize: limit,
    });

    const items = result.items.map((txn) => {
      const row = mapTransaction(txn as unknown as Record<string, unknown>);
      return {
        amount: formatInr(row.amount),
        title: row.title,
        date: row.date,
      };
    });

    return {
      success: true,
      type: 'transaction_list',
      display: { items },
    };
  }

  private static async deleteLastTransaction(
    userId: string,
    type: 'DEBIT' | 'CREDIT',
  ): Promise<BotCommandResult> {
    const recent = await TransactionRepository.findRecentByType(type, 1, { userId, groupId: null });
    const last = recent[0];
    if (!last) {
      return { success: false, message: 'No recent transaction found to delete.' };
    }

    await TransactionService.deleteTransaction(last.id, userId);
    return {
      success: true,
      type: 'transaction_deleted',
      message: `Deleted last ${type === 'DEBIT' ? 'expense' : 'income'}.`,
      transaction_id: last.id,
    };
  }

  private static async updateLastTransaction(
    userId: string,
    payload: BotCommandRequest['payload'],
  ): Promise<BotCommandResult> {
    const recent = await TransactionRepository.findRecentByType('DEBIT', 1, { userId, groupId: null });
    const last = recent[0];
    if (!last) {
      return { success: false, message: 'No recent expense found to update.' };
    }

    const updated = await TransactionService.updateTransaction(last.id, userId, {
      ...(payload?.amount && { amount: payload.amount }),
      ...(payload?.description && { description: payload.description }),
      ...(payload?.category && { categoryName: payload.category }),
    });

    const amount = Number(TransactionRepository.serializeAmount(updated as unknown as Record<string, unknown>));

    return {
      success: true,
      type: 'expense_updated',
      transaction_id: updated.id,
      display: {
        amount: formatInr(amount),
        category: payload?.category || payload?.categoryName,
        description: updated.description || updated.title,
      },
      message: 'Last expense updated.',
    };
  }
}
