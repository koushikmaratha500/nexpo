export const DEFAULT_CURRENCY_CODE = 'INR';

export interface CurrencyRef {
  id: string;
  code: string;
}

export function resolvePreferredCurrencyCode(
  currencyId: string | null | undefined,
  currencies: CurrencyRef[],
): string {
  if (!currencyId?.trim()) return DEFAULT_CURRENCY_CODE;
  const match = currencies.find((currency) => currency.id === currencyId);
  return match?.code ?? DEFAULT_CURRENCY_CODE;
}
