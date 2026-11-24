import { NextRequest } from 'next/server';
import { AiChatController } from '@/lib/api/controllers/ai-chat.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

/** Read-only: admins can view a customer's chat but never post to or delete it. */
export async function GET(
  req: NextRequest,
  segmentData: { params: Promise<{ id: string; chatId: string }> },
) {
  try {
    const { id, chatId } = await segmentData.params;
    const admin = await authGuard(req, 'ADMIN');
    return await AiChatController.adminGet(req, admin.id, id, chatId);
  } catch (error) {
    return handleApiError(error);
  }
}
