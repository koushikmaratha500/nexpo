import { NextRequest } from 'next/server';
import { AuthController } from '@/lib/api/controllers/auth.controller';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { checkRateLimit, getRequestIp, RATE_LIMIT_PRESETS } from '@/lib/api/middleware/rateLimiter';

export async function POST(req: NextRequest) {
  try {
    await checkRateLimit(req, `admin_forgot_password_${getRequestIp(req)}`, RATE_LIMIT_PRESETS.adminForgotPassword);
    return await AuthController.forgotAdminPassword(req);
  } catch (error) {
    return handleApiError(error);
  }
}