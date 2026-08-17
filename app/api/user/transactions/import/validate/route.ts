import { NextRequest } from 'next/server';
import { TransactionController } from '@/lib/api/controllers/transaction.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function POST(req: NextRequest) {
  try {
    await authGuard(req, 'CUSTOMER');
    return await TransactionController.validateImport(req);
  } catch (error) {
    return handleApiError(error);
  }
}