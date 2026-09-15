import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { PlanService } from '../services/plan.service';

export class PlanController extends BaseController {
  static async getEntitlement(_req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const entitlement = await PlanService.getEntitlement(userId);
      return {
        ...entitlement,
        catalog: await PlanService.catalog(),
      };
    }, { fallbackMessage: 'Failed to load plan' });
  }
}
