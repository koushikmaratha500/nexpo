import { describe, expect, it } from 'vitest';
import { buildInvoicePdf, toWinAnsi } from '@/lib/billing/invoice-pdf';

describe('invoice PDF', () => {
  it('renders amounts in rupees and non-Latin names without throwing', async () => {
    const pdf = await buildInvoicePdf({
      invoiceNumber: 'PS-2026-00001',
      issuedAt: new Date('2026-11-18T00:00:00.000Z'),
      legalName: 'PaysaSuchan',
      gstin: '29AAAAA0000A1Z5',
      sac: '998314',
      billingAddress: 'Bengaluru',
      customerName: 'रमेश कुमार',
      customerEmail: 'customer@example.com',
      planLabel: 'Starter (Monthly)',
      subtotalPaise: 10000,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 1800,
      totalPaise: 11800,
    });
    expect(pdf.byteLength).toBeGreaterThan(500);
  });

  it('maps the rupee sign and drops unencodable characters', () => {
    expect(toWinAnsi('Total: ₹118.00')).toBe('Total: Rs. 118.00');
    expect(toWinAnsi('José रमेश')).toBe('José ????');
  });
});
