import { NextRequest } from 'next/server';
import { ReportController } from '@/lib/api/controllers/report.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    return await ReportController.getCustomerReport(req, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
