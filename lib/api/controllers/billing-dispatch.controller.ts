import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { BillingDispatchService } from '../services/billing-dispatch.service';

export class BillingDispatchController extends BaseController {
  static async dispatch(_req: NextRequest) {
    return this.safeExecuteJson(async () => BillingDispatchService.dispatch(), {
      fallbackMessage: 'Billing dispatch failed',
    });
  }
}
