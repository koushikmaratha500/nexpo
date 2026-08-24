import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionService } from '@/lib/api/services/transaction.service';
import { TransactionRepository } from '@/lib/api/repositories/transaction.repository';
import { MetaResolutionService } from '@/lib/api/services/meta-resolution.service';
import { AuditAction } from '@prisma/client';

vi.mock('@/lib/api/repositories/transaction.repository', () => ({
  TransactionRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    createAudit: vi.fn(),
  },
}));

vi.mock('@/lib/api/services/meta-resolution.service', () => ({
  MetaResolutionService: {
    resolveForTransaction: vi.fn(),
  },
}));

const mockedCreate = vi.mocked(TransactionRepository.create);
const mockedFindById = vi.mocked(TransactionRepository.findById);
const mockedUpdate = vi.mocked(TransactionRepository.update);
const mockedSoftDelete = vi.mocked(TransactionRepository.softDelete);
const mockedCreateAudit = vi.mocked(TransactionRepository.createAudit);
const mockedResolve = vi.mocked(MetaResolutionService.resolveForTransaction);

describe('TransactionService CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedResolve.mockResolvedValue({
      categoryId: 'cat-1',
      currencyId: 'cur-1',
      paymentTypeId: 'pay-1',
      budgetDepositTypeId: 'dep-1',
      budgetTypeId: 'bud-1',
    });
  });

  it('creates a DEBIT transaction and writes audit', async () => {
    mockedCreate.mockResolvedValue({
      id: 'txn-1',
      type: 'DEBIT',
      amount: 50,
    } as never);

    const result = await TransactionService.createTransaction(
      'user-1',
      {
        type: 'DEBIT',
        title: 'Coffee',
        amount: 50,
        transactionDate: new Date('2026-01-10'),
        category: 'Food',
        isRecurring: false,
      },
      { ip: '127.0.0.1' },
    );

    expect(result.id).toBe('txn-1');
    expect(mockedCreate).toHaveBeenCalled();
    expect(mockedCreateAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.CREATE, transactionId: 'txn-1' }),
    );
  });

  it('updates a transaction and writes audit', async () => {
    mockedFindById.mockResolvedValue({ id: 'txn-1', amount: 50 } as never);
    mockedUpdate.mockResolvedValue({ id: 'txn-1', amount: 75 } as never);

    await TransactionService.updateTransaction(
      'txn-1',
      'user-1',
      { amount: 75, title: 'Updated' },
      { ip: '127.0.0.1' },
    );

    expect(mockedUpdate).toHaveBeenCalledWith('txn-1', expect.any(Object));
    expect(mockedCreateAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.UPDATE, transactionId: 'txn-1' }),
    );
  });

  it('soft-deletes a transaction and writes audit', async () => {
    mockedFindById.mockResolvedValue({ id: 'txn-1', amount: 50 } as never);
    mockedSoftDelete.mockResolvedValue({ id: 'txn-1', status: 'D' } as never);

    const result = await TransactionService.deleteTransaction('txn-1', 'user-1', { ip: '127.0.0.1' });

    expect(result.success).toBe(true);
    expect(mockedSoftDelete).toHaveBeenCalledWith('txn-1');
    expect(mockedCreateAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, transactionId: 'txn-1' }),
    );
  });
});
