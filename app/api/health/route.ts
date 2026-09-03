import { HealthController } from '@/lib/api/controllers/health.controller';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    return await HealthController.check();
  } catch (error) {
    return handleApiError(error);
  }
}

export async function HEAD() {
  const response = await GET();
  return new Response(null, { status: response.status, headers: response.headers });
}
