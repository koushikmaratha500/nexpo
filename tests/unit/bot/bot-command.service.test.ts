import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/api/middleware/errorHandler';
import { BotCommandService } from '@/lib/api/services/bot-command.service';
import { TransactionService } from '@/lib/api/services/transaction.service';
import { ReportService } from '@/lib/api/services/report.service';
import { BotRequestRepository } from '@/lib/api/repositories/bot-request.repository';
import { TransactionRepository } from '@/lib/api/repositories/transaction.repository';
import { PLAN_ERROR_CODES } from '@/lib/billing/types';

vi.mock('@/lib/api/repositories/bot-request.repository', () => ({
  BotRequestRepository: {
    findByIdempotencyKey: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock('@/lib/api/services/transaction.service', () => ({
  TransactionService: {
    createTransaction: vi.fn(),
    getTransactions: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
  },
}));

vi.mock('@/lib/api/services/report.service', () => ({
  ReportService: {
    getCustomerReport: vi.fn(),
  },
}));

vi.mock('@/lib/api/repositories/transaction.repository', () => ({
  TransactionRepository: {
    serializeAmount: vi.fn().mockReturnValue('750.00'),
    findRecentByType: vi.fn(),
  },
}));

const mockedFindByKey = vi.mocked(BotRequestRepository.findByIdempotencyKey);
const mockedCreate = vi.mocked(BotRequestRepository.create);
const mockedUpdateStatus = vi.mocked(BotRequestRepository.updateStatus);
const mockedCreateTxn = vi.mocked(TransactionService.createTransaction);
const mockedGetReport = vi.mocked(ReportService.getCustomerReport);

describe('BotCommandService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedFindByKey.mockResolvedValue(null);
    mockedCreate.mockResolvedValue({
      id: 'req-1',
      idempotencyKey: 'wa:msg-1',
      channel: 'WHATSAPP',
      externalMessageId: 'wa:msg-1',
      userId: 'user-1',
      command: 'CREATE_EXPENSE',
      status: 'RECEIVED',
      error: null,
      payload: null,
      result: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockedUpdateStatus.mockResolvedValue({} as never);
  });

  it('creates an expense from CREATE_EXPENSE command', async () => {
    mockedCreateTxn.mockResolvedValue({
      id: 'txn-1',
      description: 'Breakfast',
      title: 'Breakfast',
      merchant: 'Chandra mandalam restaurant',
      transactionDate: new Date('2026-09-18'),
      category: { name: 'Food' },
    } as never);

    const result = await BotCommandService.execute({
      command: 'CREATE_EXPENSE',
      user_id: '11111111-1111-1111-1111-111111111111',
      idempotency_key: 'wa:msg-1',
      source_channel: 'whatsapp',
      payload: {
        amount: 750,
        category: 'Food',
        description: 'Breakfast',
        merchant: 'Chandra mandalam restaurant',
        transaction_date: '2026-09-18',
      },
    });

    expect(result.success).toBe(true);
    expect(result.type).toBe('expense_created');
    expect(result.transaction_id).toBe('txn-1');
    expect(mockedCreateTxn).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
      expect.objectContaining({
        type: 'DEBIT',
        amount: 750,
        transactionDate: expect.any(Date),
      }),
    );
  });

  it('returns clarification when amount is missing', async () => {
    const result = await BotCommandService.execute({
      command: 'CREATE_EXPENSE',
      user_id: '11111111-1111-1111-1111-111111111111',
      idempotency_key: 'wa:msg-2',
      source_channel: 'whatsapp',
      payload: { category: 'Food' },
    });

    expect(result.success).toBe(false);
    expect(result.type).toBe('clarification');
    expect(mockedCreateTxn).not.toHaveBeenCalled();
  });

  it('maps plan write lock to PLAN_WRITE_LOCKED', async () => {
    mockedCreateTxn.mockRejectedValue(
      new HttpError(402, 'Trial ended', { code: PLAN_ERROR_CODES.WRITE_LOCKED }),
    );

    const result = await BotCommandService.execute({
      command: 'CREATE_EXPENSE',
      user_id: '11111111-1111-1111-1111-111111111111',
      idempotency_key: 'wa:msg-3',
      source_channel: 'whatsapp',
      payload: { amount: 100 },
    });

    expect(result.success).toBe(false);
    expect(result.error_code).toBe('PLAN_WRITE_LOCKED');
  });

  it('executes CREATE_EXPENSE from AI parse intent', async () => {
    mockedCreateTxn.mockResolvedValue({
      id: 'txn-2',
      description: 'Lunch',
      title: 'Lunch',
      merchant: null,
      transactionDate: new Date('2026-09-18'),
      category: { name: 'Food' },
    } as never);

    const result = await BotCommandService.executeFromAiParse({
      userId: '11111111-1111-1111-1111-111111111111',
      channel: 'whatsapp',
      idempotencyKey: 'wa:msg-4',
      aiParse: {
        intent: 'CREATE_EXPENSE',
        confidence: 0.9,
        type: 'DEBIT',
        amount: 500,
        currency: 'INR',
        merchant: null,
        category: 'Food',
        description: 'Lunch',
        transaction_date: '2026-09-18',
        clarification_question: null,
      },
    });

    expect(result.success).toBe(true);
    expect(result.type).toBe('expense_created');
  });

  it('returns daily summary from GET_DAILY_SUMMARY', async () => {
    mockedGetReport.mockResolvedValue({
      expenses: [],
      total: 3,
      totalAmount: 1500,
      categoryBreakdown: [{ categoryId: null, categoryName: 'Food', totalAmount: 1500, count: 3 }],
    });

    const result = await BotCommandService.execute({
      command: 'GET_DAILY_SUMMARY',
      user_id: '11111111-1111-1111-1111-111111111111',
      idempotency_key: 'wa:msg-5',
      source_channel: 'whatsapp',
      payload: {},
    });

    expect(result.success).toBe(true);
    expect(result.type).toBe('daily_summary');
    expect(result.display?.total_spend).toBe(1500);
  });
});
