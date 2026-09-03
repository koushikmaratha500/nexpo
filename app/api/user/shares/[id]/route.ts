import { NextRequest } from 'next/server';
import { TransactionShareController } from '@/lib/api/controllers/transaction-share.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function DELETE(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const user = await authGuard(req, 'CUSTOMER');
    return await TransactionShareController.revoke(req, id, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
