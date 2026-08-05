import { NextRequest } from 'next/server';
import { AuthController } from '@/lib/api/controllers/auth.controller';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function POST(req: NextRequest) {
  try {
    return await AuthController.logout(req);
  } catch (error) {
    return handleApiError(error);
  }
}
