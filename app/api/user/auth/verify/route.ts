import { NextRequest } from 'next/server';
import { AuthController } from '@/lib/api/controllers/auth.controller';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { checkRateLimit } from '@/lib/api/middleware/rateLimiter';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    await checkRateLimit(req, `verify_${ip}`);
    return await AuthController.verify(req);
  } catch (error) {
    return handleApiError(error);
  }
}
