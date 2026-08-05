import { NextRequest } from 'next/server';
import { TransactionController } from '@/lib/api/controllers/transaction.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { StorageService } from '@/lib/api/services/storage.service';

export async function GET(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    return await TransactionController.getAll(req, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
