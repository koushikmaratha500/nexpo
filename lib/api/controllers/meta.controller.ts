import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { MetaService } from '../services/meta.service';

export class MetaController extends BaseController {
  static async getCustomerMetadata(_req: NextRequest) {
    return this.safeExecuteJson(
      async () => MetaService.getCustomerMetadata(),
      { fallbackMessage: 'Failed to fetch metadata' },
    );
  }

  static async getActiveCategories(_req: NextRequest) {
    return this.safeExecuteJson(
      async () => MetaService.getActiveCategories(),
      { fallbackMessage: 'Failed to fetch categories' },
    );
  }
}
