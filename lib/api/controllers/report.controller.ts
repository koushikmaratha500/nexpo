import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { ReportService } from '../services/report.service';
import { userReportQuerySchema } from '../dtos/report.dto';

export class ReportController extends BaseController {
  static async getCustomerReport(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const { searchParams } = new URL(req.url);
      const query = userReportQuerySchema.parse({
        categoryId: searchParams.get('categoryId') || undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
        type: searchParams.get('type') || 'DEBIT',
        page: searchParams.get('page') || undefined,
        pageSize: searchParams.get('pageSize') || undefined,
      });
      return ReportService.getCustomerReport(userId, query);
    }, { fallbackMessage: 'Failed to fetch reports' });
  }
}
