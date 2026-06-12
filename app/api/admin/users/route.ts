import { NextRequest } from 'next/server';
import { AdminController } from '@/lib/api/controllers/admin.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    await authGuard(req, 'ADMIN');
    return await AdminController.getUsers(req);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await authGuard(req, 'ADMIN');
    return await AdminController.createUser(req);
  } catch (error) {
    return handleApiError(error);
  }
}
