import { NextRequest } from 'next/server';
import { PresenceController } from '@/lib/api/controllers/presence.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    await authGuard(req, 'ADMIN');
    return await PresenceController.adminOnlineStatus(req);
  } catch (error) {
    return handleApiError(error);
  }
}
