import { NextRequest } from 'next/server';
import { DashboardController } from '@/lib/api/controllers/dashboard.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    return await DashboardController.getCustomerDashboard(req, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
