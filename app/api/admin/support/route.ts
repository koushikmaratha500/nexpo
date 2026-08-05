import { NextRequest } from 'next/server';
import { SupportController } from '@/lib/api/controllers/support.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    await authGuard(req, 'ADMIN');
    return await SupportController.getAll(req);
  } catch (error) {
    return handleApiError(error);
  }
}
