import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { expenseDate: 'desc' },
      include: {
        category: true,
        currency: true,
      },
    });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Database GET expenses failed:', error);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
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

    // Find a default user (e.g. seed user) or create one if none exists
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          firstName: 'Alex',
          lastName: 'Sterling',
          email: 'user@nexpo.com',
          role: 'CUSTOMER',
          status: 'ACTIVE',
        },
      });
    }

    const newExpense = await prisma.expense.create({
      data: {
        userId: user.id,
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

    return NextResponse.json(newExpense, { status: 201 });
  } catch (error) {
    console.error('Database POST expense failed:', error);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
