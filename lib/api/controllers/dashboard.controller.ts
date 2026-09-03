import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { DashboardService } from '../services/dashboard.service';

export class DashboardController extends BaseController {
  static async getCustomerDashboard(_req: NextRequest, userId: string) {
    return this.safeExecuteJson(
      async () => DashboardService.getCustomerDashboard(userId),
      { fallbackMessage: 'Failed to fetch dashboard metrics' },
    );
  }
}
