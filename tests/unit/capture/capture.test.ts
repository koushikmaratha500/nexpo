import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/api/middleware/errorHandler';
import { buildCaptureSchema, buildCaptureSystemPrompt } from '@/lib/ai/agents/capture.agent';
import { captureAssessSchema, captureSaveSchema } from '@/lib/api/dtos/capture.dto';
import { CaptureService, similarMerchant } from '@/lib/api/services/capture.service';
import { CaptureDecisionRepository } from '@/lib/api/repositories/capture-decision.repository';
import { TransactionService } from '@/lib/api/services/transaction.service';
import { MetaRepository } from '@/lib/api/repositories/meta.repository';
import { AiUsageRepository } from '@/lib/api/repositories/aiUsage.repository';
import { assessCaptureMessages } from '@/lib/ai/agents/capture.agent';

vi.mock('@/lib/api/repositories/capture-decision.repository', () => ({
  CaptureDecisionRepository: {
    findByFingerprint: vi.fn(),
    createIfAbsent: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    listSince: vi.fn(),
    savedByReferences: vi.fn(),
    merchantHistory: vi.fn(),
    findLedgerCandidates: vi.fn(),
  },
}));
vi.mock('@/lib/api/services/transaction.service', () => ({
  TransactionService: { createTransaction: vi.fn(), getTransactionById: vi.fn() },
}));
vi.mock('@/lib/api/repositories/meta.repository', () => ({
  MetaRepository: { getActiveCategories: vi.fn(), getActivePaymentTypes: vi.fn() },
}));
vi.mock('@/lib/api/repositories/aiUsage.repository', () => ({ AiUsageRepository: { create: vi.fn() } }));
vi.mock('@/lib/ai/agents/capture.agent', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/ai/agents/capture.agent')>()),
  assessCaptureMessages: vi.fn(),
}));

const repo = vi.mocked(CaptureDecisionRepository);
const txns = vi.mocked(TransactionService);
const fp = 'a'.repeat(64);
const txnInput = { type: 'DEBIT', amount: 50, transactionDate: '2026-11-23', title: 'Fruits', isRecurring: false };

describe('capture agent schema and prompt', () => {
  it('limits category and payment mode to the given names', () => {
    const schema = buildCaptureSchema(['Food', 'Travel'], ['UPI', 'Credit Card']);
    const base = {
      id: '1', isTransaction: true, rejectReason: null, kind: 'DEBIT', amount: 50, merchant: 'X', counterparty: null,
      reference: null, accountTail: null, date: '2026-11-23', confidence: 0.9,
    };
    expect(schema.safeParse({ items: [{ ...base, category: 'Food', paymentMode: 'UPI' }] }).success).toBe(true);
    expect(schema.safeParse({ items: [{ ...base, category: 'Groceries', paymentMode: 'UPI' }] }).success).toBe(false);
    expect(schema.safeParse({ items: [{ ...base, category: 'Food', paymentMode: 'Paytm' }] }).success).toBe(false);
  });

  it('prompt carries the promo rule, examples and the user history', () => {
    const prompt = buildCaptureSystemPrompt({
      categories: ['Food'],
      paymentModes: ['UPI'],
      merchantHistory: [{ merchant: 'Jai Bhavani Fruits', category: 'Food' }],
    });
    expect(prompt).toContain('Tata Cliq');
    expect(prompt).toContain('Jai Bhavani Fruits => Food');
    expect(prompt).toContain('never the balance');
  });

  it('DTOs reject bad fingerprints and oversized batches', () => {
    expect(captureSaveSchema.safeParse({ fingerprint: 'nope', transaction: txnInput }).success).toBe(false);
    const item = { id: '1', source: 'sms', sender: 'AD-HDFCBK', text: 'x', receivedAt: '2026-11-23T10:00:00.000Z' };
    expect(captureAssessSchema.safeParse({ items: Array(21).fill(item) }).success).toBe(false);
    expect(captureAssessSchema.safeParse({ items: [item] }).success).toBe(true);
  });

  it('similarMerchant tolerates case and suffixes', () => {
    expect(similarMerchant('SWIGGY INSTAMART', 'Swiggy')).toBe(true);
    expect(similarMerchant('Zomato', 'Swiggy')).toBe(false);
    expect(similarMerchant(null, 'Swiggy')).toBe(true);
  });
});

describe('CaptureService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(MetaRepository.getActiveCategories).mockResolvedValue([{ name: 'Food' }] as never);
    vi.mocked(MetaRepository.getActivePaymentTypes).mockResolvedValue([{ name: 'UPI' }] as never);
    repo.merchantHistory.mockResolvedValue([{ merchant: 'Pavani Vadisa', category: 'Rent' }]);
    repo.savedByReferences.mockResolvedValue([]);
    repo.findLedgerCandidates.mockResolvedValue([]);
  });

  it('save creates one transaction and links the decision', async () => {
    repo.createIfAbsent.mockResolvedValue({ id: 'd1' } as never);
    txns.createTransaction.mockResolvedValue({ id: 't1' } as never);
    const result = await CaptureService.save('u1', { fingerprint: fp, reference: null, transaction: txnInput } as never);
    expect(result).toEqual({ id: 't1' });
    expect(repo.update).toHaveBeenCalledWith('d1', { transactionId: 't1' });
  });

  it('save again with the same fingerprint returns the existing transaction', async () => {
    repo.createIfAbsent.mockResolvedValue(null);
    repo.findByFingerprint.mockResolvedValue({ id: 'd1', decision: 'SAVED', transactionId: 't1' } as never);
    txns.getTransactionById.mockResolvedValue({ id: 't1' } as never);
    const result = await CaptureService.save('u1', { fingerprint: fp, transaction: txnInput } as never);
    expect(result).toEqual({ id: 't1' });
    expect(txns.createTransaction).not.toHaveBeenCalled();
  });

  it('a failed create releases the reservation', async () => {
    repo.createIfAbsent.mockResolvedValue({ id: 'd1' } as never);
    txns.createTransaction.mockRejectedValue(new HttpError(402, 'limit'));
    await expect(CaptureService.save('u1', { fingerprint: fp, transaction: txnInput } as never)).rejects.toThrow('limit');
    expect(repo.delete).toHaveBeenCalledWith('d1');
  });

  it('reject is idempotent', async () => {
    repo.createIfAbsent.mockResolvedValue(null);
    await expect(CaptureService.reject('u1', { fingerprint: fp, decision: 'REJECTED' })).resolves.toEqual({ ok: true });
  });

  it('assess applies the user category and flags ledger duplicates', async () => {
    vi.mocked(assessCaptureMessages).mockResolvedValue({
      results: [
        { id: 'a', isTransaction: true, rejectReason: null, kind: 'DEBIT', amount: 40000, merchant: 'Pavani Vadisa',
          counterparty: null, paymentMode: 'UPI', category: 'Food', reference: '666919548464', accountTail: '3504',
          date: '2026-10-30', confidence: 0.95 },
        { id: 'b', isTransaction: false, rejectReason: 'Promotional wallet credit', kind: null, amount: null, merchant: null,
          counterparty: null, paymentMode: null, category: null, reference: null, accountTail: null, date: null, confidence: 0.99 },
      ],
      inputTokens: 10,
      outputTokens: 5,
    });
    repo.findLedgerCandidates.mockResolvedValue([{ id: 't9', merchant: 'PAVANI VADISA', title: 'Rent' }] as never);
    const { items } = await CaptureService.assess('u1', {
      items: [
        { id: 'a', source: 'sms', sender: 'AD-HDFCBK', text: 'Sent Rs.40000.00', receivedAt: '2026-10-30T10:00:00.000Z' },
        { id: 'b', source: 'sms', sender: 'VM-TATACQ', text: 'Credited Rs.1000 worth cash', receivedAt: '2026-10-30T10:00:00.000Z' },
      ],
    });
    expect(items[0].category).toBe('Rent');
    expect(items[0].duplicateOf).toBe('t9');
    expect(items[1].isTransaction).toBe(false);
    expect(AiUsageRepository.create).toHaveBeenCalledWith(expect.objectContaining({ feature: 'capture', status: 'OK' }));
  });

  it('assess passes through 503 when AI is off', async () => {
    vi.mocked(assessCaptureMessages).mockRejectedValue(new HttpError(503, 'AI is not configured'));
    await expect(
      CaptureService.assess('u1', {
        items: [{ id: 'a', source: 'sms', sender: 'x', text: 'y', receivedAt: '2026-10-30T10:00:00.000Z' }],
      }),
    ).rejects.toMatchObject({ status: 503 });
  });
});
