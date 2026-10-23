import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { DashboardService } from '../services/dashboard.service';
import { dashboardQuerySchema } from '../dtos/dashboard.dto';

export class DashboardController extends BaseController {
  static async getCustomerDashboard(req: NextRequest, userId: string) {
    return this.safeExecuteJson(
      async () => {
        const { searchParams } = new URL(req.url);
        const query = dashboardQuerySchema.parse({
          month: searchParams.get('month') || undefined,
        });
        return DashboardService.getCustomerDashboard(userId, query.month);
      },
      { fallbackMessage: 'Failed to fetch dashboard metrics' },
    );
  }
}
