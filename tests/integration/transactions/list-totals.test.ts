import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { TransactionService } from '@/lib/api/services/transaction.service';
import { TransactionRepository } from '@/lib/api/repositories/transaction.repository';
import { TransactionController } from '@/lib/api/controllers/transaction.controller';

vi.mock('@/lib/api/repositories/transaction.repository', () => ({
  TransactionRepository: {
    findAll: vi.fn(),
    buildListWhere: vi.fn(),
    findLedgerRowsForWhere: vi.fn(),
    serializeItems: vi.fn((items: unknown[]) => items),
  },
}));

const mockedFindAll = vi.mocked(TransactionRepository.findAll);
const mockedBuildListWhere = vi.mocked(TransactionRepository.buildListWhere);
const mockedFindLedgerRows = vi.mocked(TransactionRepository.findLedgerRowsForWhere);

const ledgerRow = (
  type: 'DEBIT' | 'CREDIT',
  amount: number,
  category?: { name: string; type: 'DEBIT' | 'CREDIT' },
) => ({
  type,
  amount,
  category: category ?? (type === 'CREDIT' ? { name: 'Salary', type: 'CREDIT' as const } : { name: 'Food', type: 'DEBIT' as const }),
});

describe('Transaction list totals (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedBuildListWhere.mockReturnValue({ userId: 'user-1', groupId: null });
  });

  it('includeTotals sums the full filtered set, not only the current page', async () => {
    mockedFindAll.mockResolvedValue({
      items: [{ id: '1' }, { id: '2' }],
      total: 5,
    } as never);

    mockedFindLedgerRows.mockResolvedValue([
      ledgerRow('DEBIT', 100),
      ledgerRow('DEBIT', 50),
      ledgerRow('DEBIT', 25),
      ledgerRow('CREDIT', 1000),
      ledgerRow('CREDIT', 500),
    ] as never);

    const result = await TransactionService.getTransactions({
      userId: 'user-1',
      groupId: null,
      page: 1,
      pageSize: 2,
      includeTotals: true,
    });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.totalDebit).toBe(175);
    expect(result.totalCredit).toBe(1500);
    expect(mockedFindLedgerRows).toHaveBeenCalledTimes(1);
  });

  it('omits aggregate fields when includeTotals is false', async () => {
    mockedFindAll.mockResolvedValue({ items: [], total: 0 } as never);

    const result = await TransactionService.getTransactions({
      userId: 'user-1',
      groupId: null,
      page: 1,
      pageSize: 10,
      includeTotals: false,
    });

    expect(result).not.toHaveProperty('totalDebit');
    expect(mockedFindLedgerRows).not.toHaveBeenCalled();
  });

  it('uses the same list filters for aggregation as for pagination', async () => {
    const start = new Date('2026-10-01T00:00:00.000Z');
    const endExclusive = new Date('2026-11-01T00:00:00.000Z');

    mockedFindAll.mockResolvedValue({ items: [], total: 0 } as never);
    mockedFindLedgerRows.mockResolvedValue([ledgerRow('DEBIT', 40)] as never);

    await TransactionService.getTransactions({
      userId: 'user-1',
      groupId: null,
      type: 'DEBIT',
      search: 'coffee',
      startDate: start,
      endExclusive,
      page: 2,
      pageSize: 10,
      includeTotals: true,
    });

    const listParams = mockedFindAll.mock.calls[0][0];
    expect(listParams.startDate).toEqual(start);
    expect(listParams.endExclusive).toEqual(endExclusive);
    expect(listParams.search).toBe('coffee');
    expect(listParams.type).toBe('DEBIT');
    expect(listParams.page).toBe(2);

    expect(mockedBuildListWhere).toHaveBeenCalledWith(listParams);
    expect(mockedFindLedgerRows).toHaveBeenCalledWith({ userId: 'user-1', groupId: null });
  });

  it('TransactionController.getAll returns totalDebit and totalCredit when requested', async () => {
    mockedFindAll.mockResolvedValue({
      items: [{ id: 'a', amount: 10, type: 'DEBIT' }],
      total: 3,
    } as never);
    mockedFindLedgerRows.mockResolvedValue([
      ledgerRow('DEBIT', 10),
      ledgerRow('DEBIT', 20),
      ledgerRow('CREDIT', 300),
    ] as never);

    const url =
      'http://localhost/api/user/transactions?includeTotals=true&page=1&pageSize=1&startDate=2026-10-01T00:00:00.000Z&endExclusive=2026-11-01T00:00:00.000Z';
    const req = new NextRequest(url);
    const res = await TransactionController.getAll(req, 'user-1');
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.total).toBe(3);
    expect(body.items).toHaveLength(1);
    expect(body.totalDebit).toBe(30);
    expect(body.totalCredit).toBe(300);
  });
});
