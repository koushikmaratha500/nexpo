import { NextRequest } from 'next/server';
import { AuthController } from '@/lib/api/controllers/auth.controller';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { checkRateLimit, getRequestIp, RATE_LIMIT_PRESETS } from '@/lib/api/middleware/rateLimiter';

export async function POST(req: NextRequest) {
  try {
    await checkRateLimit(req, `user_forgot_password_${getRequestIp(req)}`, RATE_LIMIT_PRESETS.userForgotPassword);
    return await AuthController.forgotUserPassword(req);
  } catch (error) {
    return handleApiError(error);
  }
}
