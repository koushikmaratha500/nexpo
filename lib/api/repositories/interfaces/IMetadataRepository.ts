import { Country, Currency } from '../../domain/entities/country.entity';

export interface IMetadataRepository {
  getCountries(): Promise<Country[]>;
  getCurrencies(): Promise<Currency[]>;
  getCountryById(id: string): Promise<Country | null>;
  getCurrencyById(id: string): Promise<Currency | null>;
}
