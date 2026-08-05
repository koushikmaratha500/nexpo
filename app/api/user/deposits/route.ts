import { NextRequest } from 'next/server';
import { DepositController } from '@/lib/api/controllers/deposit.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    return await DepositController.getAll(req, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
