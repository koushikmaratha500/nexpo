import { NextRequest } from 'next/server';
import { AuthController } from '@/lib/api/controllers/auth.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function PATCH(req: NextRequest) {
  try {
    const admin = await authGuard(req, 'ADMIN');
    return await AuthController.updateProfile(req, admin.id, true);
  } catch (error) {
    return handleApiError(error);
  }
}
