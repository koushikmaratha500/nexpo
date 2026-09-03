import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SplitMode } from '@prisma/client';
import { HttpError } from '@/lib/api/middleware/errorHandler';
import { TransactionConvertService } from '@/lib/api/services/transaction-convert.service';
import { GroupService } from '@/lib/api/services/group.service';
import { GroupRepository } from '@/lib/api/repositories/group.repository';
import { SplitService } from '@/lib/api/services/split.service';

const { mockTransaction, mockTx } = vi.hoisted(() => {
  const mockTransaction = {
    findFirst: vi.fn(),
  };
  const mockTx = {
    transaction: {
      create: vi.fn(),
      delete: vi.fn(),
    },
    groupExpenseSplit: {
      createMany: vi.fn(),
    },
    recurringTransactionAction: {
      deleteMany: vi.fn(),
    },
    transactionShare: {
      updateMany: vi.fn(),
    },
    transactionAudit: {
      create: vi.fn(),
    },
  };
  return { mockTransaction, mockTx };
});

vi.mock('@/lib/prisma', () => ({
  prisma: {
    transaction: mockTransaction,
    $transaction: vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
  },
}));

vi.mock('@/lib/api/services/group.service', () => ({
  GroupService: {
    assertMember: vi.fn(),
  },
}));

vi.mock('@/lib/api/repositories/group.repository', () => ({
  GroupRepository: {
    findByIdWithMembers: vi.fn(),
  },
}));

const mockedFindFirst = mockTransaction.findFirst;
const mockedAssertMember = vi.mocked(GroupService.assertMember);
const mockedFindGroup = vi.mocked(GroupRepository.findByIdWithMembers);

describe('TransactionConvertService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAssertMember.mockResolvedValue({ role: 'ADMIN' } as never);
    mockTx.transaction.create.mockResolvedValue({ id: 'txn-new' });
    mockTx.groupExpenseSplit.createMany.mockResolvedValue({ count: 2 });
    mockTx.recurringTransactionAction.deleteMany.mockResolvedValue({ count: 0 });
    mockTx.transactionShare.updateMany.mockResolvedValue({ count: 0 });
    mockTx.transaction.delete.mockResolvedValue({ id: 'txn-old' });
    mockTx.transactionAudit.create.mockResolvedValue({ id: 'audit-1' });
  });

  it('rejects recurring transactions', async () => {
    mockedFindFirst.mockResolvedValue({
      id: 'txn-1',
      isRecurring: true,
      groupId: null,
      userId: 'user-1',
    });

    await expect(
      TransactionConvertService.convert('user-1', 'txn-1', { target: 'personal' }),
    ).rejects.toThrow(/Recurring transactions cannot be converted/);
  });

  it('converts personal transaction to group with equal split', async () => {
    mockedFindFirst.mockResolvedValue({
      id: 'txn-old',
      userId: 'user-1',
      groupId: null,
      isRecurring: false,
      amount: 100,
      type: 'DEBIT',
      categoryId: 'cat-1',
      currencyId: 'cur-1',
      paymentTypeId: 'pay-1',
      budgetDepositTypeId: null,
      budgetTypeId: null,
      title: 'Dinner',
      description: null,
      transactionDate: new Date(),
      notes: null,
      documentUrl: null,
      documentFileName: null,
      documentMimeType: null,
      documentSize: null,
      merchant: 'Cafe',
      splits: [],
    });

    mockedFindGroup.mockResolvedValue({
      id: 'group-1',
      members: [{ userId: 'user-1' }, { userId: 'user-2' }],
    } as never);

    const splits = SplitService.calculate('EQUAL_INCLUDED', 100, [
      { userId: 'user-1', included: true },
      { userId: 'user-2', included: true },
    ], 'user-1');

    const result = await TransactionConvertService.convert('user-1', 'txn-old', {
      target: 'group',
      groupId: 'group-1',
    });

    expect(result.target).toBe('group');
    expect(result.newTransactionId).toBe('txn-new');
    expect(mockTx.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          groupId: 'group-1',
          splitMode: SplitMode.EQUAL_INCLUDED,
        }),
      }),
    );
    expect(mockTx.groupExpenseSplit.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ userId: splits[0].userId }),
      ]),
    });
    expect(mockTx.transaction.delete).toHaveBeenCalledWith({ where: { id: 'txn-old' } });
  });

  it('converts group transaction to personal for creator', async () => {
    mockedFindFirst.mockResolvedValue({
      id: 'txn-old',
      userId: 'user-1',
      groupId: 'group-1',
      createdByUserId: 'user-1',
      isRecurring: false,
      amount: 50,
      type: 'DEBIT',
      categoryId: 'cat-1',
      currencyId: 'cur-1',
      paymentTypeId: 'pay-1',
      budgetDepositTypeId: null,
      budgetTypeId: null,
      title: 'Taxi',
      description: null,
      transactionDate: new Date(),
      notes: null,
      documentUrl: null,
      documentFileName: null,
      documentMimeType: null,
      documentSize: null,
      merchant: null,
      splits: [],
    });

    const result = await TransactionConvertService.convert('user-1', 'txn-old', { target: 'personal' });

    expect(result.target).toBe('personal');
    expect(mockTx.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          groupId: null,
          splitMode: null,
        }),
      }),
    );
    expect(mockTx.transaction.delete).toHaveBeenCalledWith({ where: { id: 'txn-old' } });
  });

  it('blocks convert when user is not creator or admin', async () => {
    mockedFindFirst.mockResolvedValue({
      id: 'txn-old',
      userId: 'user-2',
      groupId: 'group-1',
      createdByUserId: 'user-2',
      isRecurring: false,
      amount: 50,
      splits: [],
    });
    mockedAssertMember.mockResolvedValue({ role: 'MEMBER' } as never);

    await expect(
      TransactionConvertService.convert('user-1', 'txn-old', { target: 'personal' }),
    ).rejects.toBeInstanceOf(HttpError);
  });
});
