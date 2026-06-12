import { NextRequest } from 'next/server';
import { AuthController } from '@/lib/api/controllers/auth.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    return await AuthController.getProfile(req, user.id, false);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    return await AuthController.updateProfile(req, user.id, false);
  } catch (error) {
    return handleApiError(error);
  }
}
