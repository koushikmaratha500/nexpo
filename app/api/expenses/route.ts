import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { expenseDate: 'desc' },
      include: {
        category: true,
        currency: true,
        paymentType: true,
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

    // Find or create default country
    let country = await prisma.country.findFirst();
    if (!country) {
      country = await prisma.country.create({
        data: { name: 'India', isoCode: 'IN', status: 'A' }
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
          status: 'A',
          countryId: country.id,
          currencyId: currency.id,
        },
      });
    }

    const newExpense = await prisma.expense.create({
      data: {
        userId: user.id,
        categoryId: category.id,
        currencyId: currency.id,
        paymentTypeId: paymentTypeRec.id,
        title: merchant || 'Expense Title',
        amount: parseFloat(amount),
        expenseDate: new Date(date),
        notes: notes || null,
        status: 'A',
      },
      include: {
        category: true,
        currency: true,
        paymentType: true,
      },
    });

    return NextResponse.json(newExpense, { status: 201 });
  } catch (error) {
    console.error('Database POST expense failed:', error);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
