import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CURRENCY_CODE,
  resolvePreferredCurrencyCode,
} from '@/lib/currency/preferredCurrency';

const currencies = [
  { id: 'cur-inr', code: 'INR' },
  { id: 'cur-usd', code: 'USD' },
  { id: 'cur-eur', code: 'EUR' },
];

describe('resolvePreferredCurrencyCode', () => {
  it('returns INR when no currency preference is set', () => {
    expect(resolvePreferredCurrencyCode(null, currencies)).toBe(DEFAULT_CURRENCY_CODE);
    expect(resolvePreferredCurrencyCode(undefined, currencies)).toBe(DEFAULT_CURRENCY_CODE);
    expect(resolvePreferredCurrencyCode('', currencies)).toBe(DEFAULT_CURRENCY_CODE);
  });

  it('maps the saved currencyId to its code', () => {
    expect(resolvePreferredCurrencyCode('cur-usd', currencies)).toBe('USD');
    expect(resolvePreferredCurrencyCode('cur-eur', currencies)).toBe('EUR');
  });

  it('falls back to INR when the currencyId is unknown', () => {
    expect(resolvePreferredCurrencyCode('missing-id', currencies)).toBe(DEFAULT_CURRENCY_CODE);
  });
});
