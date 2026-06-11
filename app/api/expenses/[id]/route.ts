import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const body = await req.json();
    const { merchant, categoryName, amount, date, paymentType, notes, currencyCode } = body;

    // Get or create category
    let category = await prisma.category.findFirst({
      where: { name: { equals: categoryName, mode: 'insensitive' } },
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: categoryName, isActive: true },
      });
    }

    // Get or create currency
    let currency = await prisma.currency.findUnique({
      where: { code: currencyCode },
    });

    if (!currency) {
      currency = await prisma.currency.create({
        data: { code: currencyCode, name: currencyCode, symbol: '₹' },
      });
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        categoryId: category.id,
        currencyId: currency.id,
        amount: parseFloat(amount),
        expenseDate: new Date(date),
        paymentType: paymentType || 'Credit Card',
        notes: notes || null,
      },
      include: {
        category: true,
        currency: true,
      },
    });

    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error('Database PUT expense failed:', error);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    await prisma.expense.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database DELETE expense failed:', error);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
