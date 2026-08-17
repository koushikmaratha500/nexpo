import { NextRequest } from 'next/server';
import { TransactionController } from '@/lib/api/controllers/transaction.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    await authGuard(req, 'CUSTOMER');
    const template = await TransactionController.getImportTemplate();
    return template;
  } catch (error) {
    return handleApiError(error);
  }
}