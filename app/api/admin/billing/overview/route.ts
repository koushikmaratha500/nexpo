import { NextRequest } from 'next/server';
import { BillingController } from '@/lib/api/controllers/billing.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    await authGuard(req, 'ADMIN');
    return await BillingController.getAdminOverview();
  } catch (error) {
    return handleApiError(error);
  }
}
