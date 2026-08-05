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

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const body = await req.json();
    const { title, amount, category, notes, type, date, documentName, documentSize, documentDate, documentUrl } = body;

    const currentData = readData();
    const index = currentData.findIndex((c: any) => c.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    currentData[index] = {
      ...currentData[index],
      title,
      amount: parseFloat(amount),
      category,
      notes,
      type,
      date,
      documentName,
      documentSize,
      documentDate,
      documentUrl,
    };

    writeData(currentData);
    return NextResponse.json(currentData[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const currentData = readData();
    const filteredData = currentData.filter((c: any) => c.id !== id);

    if (currentData.length === filteredData.length) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    writeData(filteredData);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
