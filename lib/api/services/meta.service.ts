import { MetaRepository } from '../repositories/meta.repository';
import { kvGetJson, kvSetJson } from '../utils/redisClient';

const CUSTOMER_METADATA_CACHE_KEY = 'nexpo:metadata:v1:customer';
const CUSTOMER_METADATA_TTL_SECONDS = 300;

export class MetaService {
  static async getCustomerMetadata() {
    try {
      const cached = await kvGetJson<Awaited<ReturnType<typeof MetaRepository.getCustomerMetadata>>>(
        CUSTOMER_METADATA_CACHE_KEY,
      );
      if (cached) {
        return cached;
      }
    } catch (error) {
      console.warn('[meta] cache read failed', error);
    }

    const fresh = await MetaRepository.getCustomerMetadata();
    try {
      await kvSetJson(CUSTOMER_METADATA_CACHE_KEY, fresh, CUSTOMER_METADATA_TTL_SECONDS);
    } catch (error) {
      console.warn('[meta] cache write failed', error);
    }
    return fresh;
  }

  static async getActiveCategories() {
    return MetaRepository.getActiveCategories();
  }
}
