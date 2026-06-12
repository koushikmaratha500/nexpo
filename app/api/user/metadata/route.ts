import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    await authGuard(req, 'CUSTOMER');
    const [countries, currencies] = await Promise.all([
      prisma.country.findMany({
        where: { status: 'A' },
        orderBy: { name: 'asc' },
        include: { currency: true }
      }),
      prisma.currency.findMany({
        where: { status: 'A' },
        orderBy: { code: 'asc' }
      })
    ]);
    return NextResponse.json({ countries, currencies });
  } catch (error) {
    return handleApiError(error);
  }
}
