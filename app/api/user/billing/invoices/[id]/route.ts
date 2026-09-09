import { NextRequest } from 'next/server';
import { BillingController } from '@/lib/api/controllers/billing.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    const { id } = await params;
    return await BillingController.downloadInvoice(req, user.id, id);
  } catch (error) {
    return handleApiError(error);
  }
}
