import { MetaRepository } from '../repositories/meta.repository';

export class MetaService {
  static async getCustomerMetadata() {
    return MetaRepository.getCustomerMetadata();
  }

  static async getActiveCategories() {
    return MetaRepository.getActiveCategories();
  }
}
