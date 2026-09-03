import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImportService } from '@/lib/api/services/import.service';

vi.mock('@/lib/api/repositories/meta.repository', () => ({
  MetaRepository: {
    getActiveCategories: vi.fn().mockResolvedValue([{ name: 'Food' }, { name: 'Travel' }]),
    getActivePaymentTypes: vi.fn().mockResolvedValue([{ name: 'Credit Card' }, { name: 'UPI' }]),
    getActiveCurrencies: vi.fn().mockResolvedValue([{ code: 'INR' }, { code: 'USD' }]),
  },
}));

describe('ImportService.validateCsv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts a valid DEBIT row', async () => {
    const csv = [
      'Type,Title,Merchant,Category,Amount,Date,Currency,Payment Type,Notes,Recurring',
      'DEBIT,Lunch,,Food,250.00,2026-01-15,INR,Credit Card,Team lunch,FALSE',
    ].join('\n');

    const result = await ImportService.validateCsv(csv);
    expect(result.summary.valid).toBe(true);
    expect(result.summary.validRows).toBe(1);
    expect(result.summary.errorRows).toBe(0);
  });

  it('reports row errors for invalid type and unknown category', async () => {
    const csv = [
      'Type,Title,Merchant,Category,Amount,Date,Currency,Payment Type,Notes,Recurring',
      'EXPENSE,Lunch,,Unknown,250.00,2026-01-15,INR,Credit Card,,FALSE',
    ].join('\n');

    const result = await ImportService.validateCsv(csv);
    expect(result.summary.valid).toBe(false);
    expect(result.summary.errorRows).toBe(1);
    expect(result.rows[0].errors.length).toBeGreaterThan(0);
  });

  it('rejects files over the row limit', async () => {
    const header = 'Type,Title,Merchant,Category,Amount,Date,Currency,Payment Type,Notes,Recurring';
    const rows = Array.from({ length: 201 }, () => 'DEBIT,Row,,Food,10,2026-01-15,INR,Credit Card,,FALSE');
    const csv = [header, ...rows].join('\n');

    const result = await ImportService.validateCsv(csv);
    expect(result.summary.valid).toBe(false);
    expect(result.summary.fileError).toMatch(/maximum allowed is 200/i);
  });
});
