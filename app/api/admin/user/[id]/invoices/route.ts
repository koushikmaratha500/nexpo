import { NextRequest } from 'next/server';
import { BillingController } from '@/lib/api/controllers/billing.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await authGuard(req, 'ADMIN');
    const { id } = await params;
    return await BillingController.listInvoicesForAdmin(req, id);
  } catch (error) {
    return handleApiError(error);
  }
}
