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
        data: {
          name: categoryName,
          code: categoryName.toUpperCase().replace(/\s+/g, '_').trim(),
          status: 'A'
        },
      });
    }

    // Get or create currency
    let currency = await prisma.currency.findUnique({
      where: { code: currencyCode },
    });

    if (!currency) {
      currency = await prisma.currency.create({
        data: { code: currencyCode, name: currencyCode, symbol: '₹', status: 'A' },
      });
    }

    // Get or create paymentType
    const paymentTypeName = paymentType || 'Credit Card';
    let paymentTypeRec = await prisma.paymentType.findFirst({
      where: { name: { equals: paymentTypeName, mode: 'insensitive' } },
    });

    if (!paymentTypeRec) {
      paymentTypeRec = await prisma.paymentType.create({
        data: {
          name: paymentTypeName,
          code: paymentTypeName.toUpperCase().replace(/\s+/g, '_').trim(),
          status: 'A'
        },
      });
    }

    const updatedExpense = await prisma.transaction.update({
      where: { id },
      data: {
        categoryId: category.id,
        currencyId: currency.id,
        paymentTypeId: paymentTypeRec.id,
        title: merchant || 'Expense Title',
        type: 'DEBIT',
        amount: parseFloat(amount),
        transactionDate: new Date(date),
        notes: notes || null,
      },
      include: {
        category: true,
        currency: true,
        paymentType: true,
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
    await prisma.transaction.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database DELETE expense failed:', error);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
