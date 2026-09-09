import { NextRequest } from 'next/server';
import { BillingController } from '@/lib/api/controllers/billing.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function POST(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    return await BillingController.createCheckout(req, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
