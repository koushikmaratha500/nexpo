import { NextRequest } from 'next/server';
import { AdminController } from '@/lib/api/controllers/admin.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

async function handleAdministrators(req: NextRequest) {
  try {
    await authGuard(req, 'ADMIN');
    if (req.method === 'GET') {
      return await AdminController.getAdministrators(req);
    }
    if (req.method === 'POST') {
      return await AdminController.createAdministrator(req);
    }
    return new Response(null, { status: 405 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  return handleAdministrators(req);
}

export async function POST(req: NextRequest) {
  return handleAdministrators(req);
}
