import { NextRequest } from 'next/server';
import { ExpenseController } from '@/lib/api/controllers/expense.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    return await ExpenseController.getAll(req, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
