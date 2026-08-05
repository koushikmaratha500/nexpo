import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { z } from 'zod';

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100).optional(),
  code: z.string().min(1, 'System code is required').max(50).optional(),
  type: z.enum(['DEBIT', 'CREDIT']).optional(),
  color: z.string().nullish().optional(),
  icon: z.string().nullish().optional(),
  status: z.enum(['A', 'B', 'P', 'I']).optional(),
});

export async function GET(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    await authGuard(req, 'ADMIN');
    const { id } = await segmentData.params;

    const category = await prisma.category.findUnique({
      where: { id, status: { not: 'D' } },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    await authGuard(req, 'ADMIN');
    const { id } = await segmentData.params;

    const body = await req.json();
    const validated = updateCategorySchema.parse(body);

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing || existing.status === 'D') {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (validated.name || validated.code) {
      const conflict = await prisma.category.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(validated.name ? [{ name: validated.name }] : []),
            ...(validated.code ? [{ code: validated.code }] : []),
          ],
        },
      });
      if (conflict) {
        return NextResponse.json({ error: 'A category with this name or code already exists' }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.code) updateData.code = validated.code;
    if (validated.type) updateData.type = validated.type;
    updateData.color = validated.color ?? null;
    if (validated.icon !== undefined) updateData.icon = validated.icon ?? '';
    if (validated.status) updateData.status = validated.status;

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(category);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      const message = error.errors?.[0]?.message || 'Validation error';
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    await authGuard(req, 'ADMIN');
    const { id } = await segmentData.params;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category || category.status === 'D') {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check if transactions are linked to this category
    const linkedCount = await prisma.transaction.count({
      where: { categoryId: id, status: { not: 'D' } },
    });

    if (linkedCount > 0) {
      return NextResponse.json({
        error: `Cannot delete category. It is linked to ${linkedCount} transaction(s). Edit or change its status instead.`,
        linkedCount,
      }, { status: 409 });
    }

    // Soft delete
    await prisma.category.update({
      where: { id },
      data: { status: 'D' },
    });

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    return handleApiError(error);
  }
}