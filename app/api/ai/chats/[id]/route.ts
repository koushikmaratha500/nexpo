import { NextRequest } from 'next/server';
import { AiChatController } from '@/lib/api/controllers/ai-chat.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const user = await authGuard(req, 'CUSTOMER');
    return await AiChatController.get(user.id, id);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const user = await authGuard(req, 'CUSTOMER');
    return await AiChatController.remove(user.id, id);
  } catch (error) {
    return handleApiError(error);
  }
}
