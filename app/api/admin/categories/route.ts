import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  code: z.string().min(1, 'System code is required').max(50),
  type: z.enum(['DEBIT', 'CREDIT']).default('CREDIT'),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  status: z.enum(['A', 'B', 'P', 'I']).default('A'),
});

export async function GET(req: NextRequest) {
  try {
    await authGuard(req, 'ADMIN');
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      prisma.category.findMany({
        where: { status: { not: 'D' } },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.category.count({ where: { status: { not: 'D' } } }),
    ]);

    return NextResponse.json({ items, total });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await authGuard(req, 'ADMIN');
    const body = await req.json();
    const validated = createCategorySchema.parse(body);

    const existing = await prisma.category.findFirst({
      where: { OR: [{ name: validated.name }, { code: validated.code }] },
    });
    if (existing) {
      return NextResponse.json({
        error: existing.name === validated.name
          ? 'A category with this name already exists'
          : 'A category with this code already exists'
      }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name: validated.name,
        code: validated.code,
        type: validated.type,
        color: validated.color || null,
        icon: validated.icon || '',
        status: validated.status,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}