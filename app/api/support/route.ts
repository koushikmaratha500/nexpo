import { NextRequest } from 'next/server';
import { SupportController } from '@/lib/api/controllers/support.controller';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { checkRateLimit } from '@/lib/api/middleware/rateLimiter';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    await checkRateLimit(req, `support_${ip}`);
    return await SupportController.create(req);
  } catch (error) {
    return handleApiError(error);
  }
}
