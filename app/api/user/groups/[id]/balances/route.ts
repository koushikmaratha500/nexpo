import { NextRequest } from 'next/server';
import { GroupTransactionController } from '@/lib/api/controllers/group-transaction.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const user = await authGuard(req, 'CUSTOMER');
    return await GroupTransactionController.balances(req, id, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
