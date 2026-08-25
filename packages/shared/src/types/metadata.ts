export interface CategoryOption {
  id: string;
  name: string;
  type?: 'DEBIT' | 'CREDIT';
}

export interface PaymentTypeOption {
  id: string;
  name: string;
}

export interface CurrencyOption {
  id: string;
  code: string;
  symbol: string;
  name: string;
}

export interface CountryOption {
  id: string;
  name: string;
  isoCode: string;
  currencyId?: string;
}

export interface UserMetadata {
  categories: CategoryOption[];
  paymentTypes: PaymentTypeOption[];
  currencies: CurrencyOption[];
  countries: CountryOption[];
  budgetDepositTypes?: PaymentTypeOption[];
}
