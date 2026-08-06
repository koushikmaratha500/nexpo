import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { HttpError } from '@/lib/api/middleware/errorHandler';

vi.mock('@/lib/api/middleware/authGuard', () => ({
  authGuard: vi.fn(async () => ({ id: 'u1', role: 'CUSTOMER' })),
}));

vi.mock('@/lib/api/middleware/rateLimiter', () => ({
  checkRateLimit: vi.fn(async () => {}),
}));

vi.mock('@/lib/ai/agents/receipt.agent', () => ({
  extractReceipt: vi.fn(),
}));

vi.mock('@/lib/api/repositories/aiUsage.repository', () => ({
  AiUsageRepository: { create: vi.fn(async () => ({})) },
}));

import { authGuard } from '@/lib/api/middleware/authGuard';
import { checkRateLimit } from '@/lib/api/middleware/rateLimiter';
import { extractReceipt } from '@/lib/ai/agents/receipt.agent';
import { AiUsageRepository } from '@/lib/api/repositories/aiUsage.repository';
import { POST } from '@/app/api/ai/ocr/route';

const mockedAuth = vi.mocked(authGuard);
const mockedRate = vi.mocked(checkRateLimit);
const mockedExtract = vi.mocked(extractReceipt);
const mockedAudit = vi.mocked(AiUsageRepository.create);

function formRequest(form: () => FormData): NextRequest {
  return new NextRequest('http://localhost/api/ai/ocr', { method: 'POST', body: form() });
}

function makeForm(overrides: Partial<{ file: File; categories: string; paymentTypes: string }> = {}) {
  const fd = new FormData();
  const file = overrides.file ?? new File([new Uint8Array([1, 2, 3])], 'r.png', { type: 'image/png' });
  fd.append('file', file);
  if (overrides.categories !== undefined) fd.append('categories', overrides.categories);
  if (overrides.paymentTypes !== undefined) fd.append('paymentTypes', overrides.paymentTypes);
  return fd;
}

beforeEach(() => {
  mockedExtract.mockReset();
  mockedAudit.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/ai/ocr validation', () => {
  it('returns 400 when no file is uploaded', async () => {
    const fd = new FormData();
    const res = await POST(formRequest(() => fd));
    expect(res.status).toBe(400);
  });

  it('returns 415 for an unsupported mime type', async () => {
    const file = new File(['text'], 'note.txt', { type: 'text/plain' });
    const res = await POST(formRequest(() => makeForm({ file })));
    expect(res.status).toBe(415);
  });

  it('returns 413 for a file larger than 10 MB', async () => {
    const blob = new Blob([new Uint8Array(11 * 1024 * 1024)], { type: 'image/png' });
    const file = new File([blob], 'big.png', { type: 'image/png' });
    const res = await POST(formRequest(() => makeForm({ file })));
    expect(res.status).toBe(413);
  });

  it('returns 422 for malformed categories/paymentTypes JSON', async () => {
    const res = await POST(formRequest(() => makeForm({ categories: 'not-json' })));
    expect(res.status).toBe(422);
  });

  it('parses name lists and returns the extraction on success', async () => {
    mockedExtract.mockResolvedValue({
      extraction: { type: 'DEBIT', title: 'Fresh Mart', amount: 1499.4, date: '2026-08-05', currency: 'INR', category: 'Groceries', paymentType: 'Debit Card' },
      inputTokens: 10,
      outputTokens: 5,
    });

    const res = await POST(
      formRequest(() => makeForm({ categories: JSON.stringify(['Groceries', 'Utilities']), paymentTypes: JSON.stringify(['Debit Card']) }))
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.extraction.category).toBe('Groceries');
    expect(mockedExtract).toHaveBeenCalledWith(
      expect.objectContaining({ categoryNames: ['Groceries', 'Utilities'], paymentTypeNames: ['Debit Card'] })
    );
    expect(mockedAudit).toHaveBeenCalledWith(expect.objectContaining({ feature: 'ocr', status: 'OK' }));
  });
});

describe('POST /api/ai/ocr provider error mapping', () => {
  it('maps a provider 429 to a 429 response', async () => {
    const err = Object.assign(new Error('Rate limit exceeded: free-models-per-day'), { statusCode: 429 });
    mockedExtract.mockRejectedValue(err);

    const res = await POST(formRequest(() => makeForm()));
    expect(res.status).toBe(429);
    expect(mockedAudit).toHaveBeenCalledWith(expect.objectContaining({ feature: 'ocr', status: 'ERROR' }));
  });

  it('maps a provider 503 to a 503 response', async () => {
    mockedExtract.mockRejectedValue(Object.assign(new Error('provider overloaded'), { statusCode: 503 }));

    const res = await POST(formRequest(() => makeForm()));
    expect(res.status).toBe(503);
  });

  it('lets unexpected errors fall through as 500', async () => {
    mockedExtract.mockRejectedValue(new Error('boom'));

    const res = await POST(formRequest(() => makeForm()));
    expect(res.status).toBe(500);
  });

  it('does not audit error rows for auth failures', async () => {
    mockedAuth.mockRejectedValueOnce(Object.assign(new Error('Unauthorized'), { status: 401 }));

    const res = await POST(formRequest(() => makeForm()));
    expect(res.status).toBe(401);
    expect(mockedAudit).not.toHaveBeenCalled();
  });

  it('skips error audit rows for user rate-limit 429s', async () => {
    mockedRate.mockRejectedValueOnce(new HttpError(429, 'Too many requests. Please try again later.'));

    const res = await POST(formRequest(() => makeForm()));
    expect(res.status).toBe(429);
    expect(mockedAudit).not.toHaveBeenCalled();
  });
});
