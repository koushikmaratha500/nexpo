import { NextRequest } from 'next/server';
import { AdminGroupController } from '@/lib/api/controllers/admin-group.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    await authGuard(req, 'ADMIN');
    return await AdminGroupController.list(req);
  } catch (error) {
    return handleApiError(error);
  }
}
