import { NextRequest } from 'next/server';
import { AiChatController } from '@/lib/api/controllers/ai-chat.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    return await AiChatController.list(user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
