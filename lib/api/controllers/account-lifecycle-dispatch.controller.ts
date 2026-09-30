import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { AccountLifecycleService } from '../services/account-lifecycle.service';

export class AccountLifecycleDispatchController extends BaseController {
  static async purge(_req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const result = await AccountLifecycleService.purgeDueAccounts();
      return { success: true, ...result };
    }, { fallbackMessage: 'Failed to purge account lifecycle records' });
  }
}
