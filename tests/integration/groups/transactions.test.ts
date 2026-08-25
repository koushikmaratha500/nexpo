import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GroupMemberRole } from '@prisma/client';
import { HttpError } from '@/lib/api/middleware/errorHandler';
import { GroupTransactionService } from '@/lib/api/services/group-transaction.service';
import { GroupService } from '@/lib/api/services/group.service';
import { GroupRepository } from '@/lib/api/repositories/group.repository';
import { GroupTransactionRepository } from '@/lib/api/repositories/group-transaction.repository';
import { MetaResolutionService } from '@/lib/api/services/meta-resolution.service';

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

vi.mock('@/lib/api/repositories/group-transaction.repository', () => ({
  GroupTransactionRepository: {
    createWithSplits: vi.fn(),
    findByGroup: vi.fn(),
    findByIdInGroup: vi.fn(),
    updateWithSplits: vi.fn(),
    softDeleteInGroup: vi.fn(),
    computeBalances: vi.fn(),
    serializeTransaction: vi.fn((txn) => txn),
    serializeItems: vi.fn((items) => items),
  },
}));

vi.mock('@/lib/api/services/meta-resolution.service', () => ({
  MetaResolutionService: {
    resolveForTransaction: vi.fn(),
  },
}));

const mockedAssertMember = vi.mocked(GroupService.assertMember);
const mockedFindByIdWithMembers = vi.mocked(GroupRepository.findByIdWithMembers);
const mockedCreateWithSplits = vi.mocked(GroupTransactionRepository.createWithSplits);
const mockedFindByIdInGroup = vi.mocked(GroupTransactionRepository.findByIdInGroup);
const mockedSoftDeleteInGroup = vi.mocked(GroupTransactionRepository.softDeleteInGroup);
const mockedResolve = vi.mocked(MetaResolutionService.resolveForTransaction);

describe('GroupTransactionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAssertMember.mockResolvedValue({ role: GroupMemberRole.MEMBER } as never);
    mockedResolve.mockResolvedValue({
      categoryId: 'cat-1',
      currencyId: 'cur-1',
      paymentTypeId: 'pay-1',
      budgetDepositTypeId: 'dep-1',
      budgetTypeId: 'bud-1',
    });
    mockedFindByIdWithMembers.mockResolvedValue({
      id: 'group-1',
      members: [
        { userId: 'user-1', user: { id: 'user-1' } },
        { userId: 'user-2', user: { id: 'user-2' } },
      ],
    } as never);
  });

  it('creates a group transaction with equal splits', async () => {
    mockedCreateWithSplits.mockResolvedValue({
      id: 'txn-1',
      amount: 120,
      splits: [],
    } as never);

    const result = await GroupTransactionService.createTransaction(
      'group-1',
      'user-1',
      {
        type: 'DEBIT',
        title: 'Dinner',
        amount: 120,
        transactionDate: new Date('2026-08-24'),
        isRecurring: false,
        split: {
          mode: 'EQUAL_INCLUDED',
          participants: [
            { userId: 'user-1', included: true },
            { userId: 'user-2', included: true },
          ],
        },
      },
      { ip: '127.0.0.1' },
    );

    expect((result as unknown as { id: string }).id).toBe('txn-1');
    expect(mockedCreateWithSplits).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction: expect.objectContaining({
          groupId: 'group-1',
          createdByUserId: 'user-1',
          userId: 'user-1',
          splitMode: 'EQUAL_INCLUDED',
        }),
        splits: expect.arrayContaining([
          expect.objectContaining({ userId: 'user-1', computedAmount: 60 }),
          expect.objectContaining({ userId: 'user-2', computedAmount: 60 }),
        ]),
      }),
    );
  });

  it('rejects split participants who are not group members', async () => {
    await expect(
      GroupTransactionService.createTransaction('group-1', 'user-1', {
        type: 'DEBIT',
        title: 'Dinner',
        amount: 120,
        transactionDate: new Date('2026-08-24'),
        isRecurring: false,
        split: {
          mode: 'EQUAL_INCLUDED',
          participants: [{ userId: 'outsider', included: true }],
        },
      }),
    ).rejects.toThrow(HttpError);
  });

  it('allows creator to delete their transaction', async () => {
    mockedFindByIdInGroup.mockResolvedValue({
      id: 'txn-1',
      createdByUserId: 'user-1',
      userId: 'user-1',
    } as never);
    mockedSoftDeleteInGroup.mockResolvedValue({ id: 'txn-1', status: 'D' } as never);

    const result = await GroupTransactionService.deleteTransaction('group-1', 'txn-1', 'user-1');

    expect(result.success).toBe(true);
    expect(mockedSoftDeleteInGroup).toHaveBeenCalled();
  });

  it('blocks non-creator members from deleting another member transaction', async () => {
    mockedFindByIdInGroup.mockResolvedValue({
      id: 'txn-1',
      createdByUserId: 'user-2',
      userId: 'user-2',
    } as never);

    await expect(
      GroupTransactionService.deleteTransaction('group-1', 'txn-1', 'user-1'),
    ).rejects.toThrow('Only the creator or a group admin can modify this transaction');
  });
});
