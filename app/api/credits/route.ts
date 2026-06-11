import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'mock', 'credits_db.json');

const readData = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeData = (data: any) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
};

export async function GET() {
  try {
    const data = readData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, amount, category, notes, type, date, documentName, documentSize, documentDate, documentUrl } = body;

    const currentData = readData();
    const newCredit = {
      id: `cr${Date.now()}`,
      title,
      amount: parseFloat(amount),
      currency: 'INR',
      category,
      notes,
      type,
      date,
      documentName,
      documentSize,
      documentDate,
      documentUrl,
      status: 'VERIFIED',
    };

    currentData.unshift(newCredit);
    writeData(currentData);

    return NextResponse.json(newCredit, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
