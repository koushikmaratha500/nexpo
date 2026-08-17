import { NextRequest } from 'next/server';
import { AuthController } from '@/lib/api/controllers/auth.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function POST(req: NextRequest) {
  try {
    const auth = await authGuard(req, 'CUSTOMER');
    return await AuthController.completeForcedPasswordReset(req, auth.id);
  } catch (error) {
    return handleApiError(error);
  }
}
