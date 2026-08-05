import { NextRequest, NextResponse } from 'next/server';
import { ExpenseController } from '@/lib/api/controllers/expense.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { StorageService } from '@/lib/api/services/storage.service';

export async function POST(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');

    // Parse multipart/form-data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    // Extract text fields from FormData
    const body: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      if (key !== 'file') {
        body[key] = value;
      }
    }

    // Parse numeric fields
    if (body.amount) body.amount = parseFloat(body.amount);
    if (body.receiptSize) body.receiptSize = parseInt(body.receiptSize);

    // If a file is attached, upload it to Supabase storage first
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadResult = await StorageService.uploadFile(buffer, file.name, file.type, 'nexpo');
      body.receiptUrl = uploadResult.url;
      body.receiptFileName = file.name;
      body.receiptMimeType = file.type;
      body.receiptSize = file.size;
    }

    return await ExpenseController.createFromParsed(body, user.id, req);
  } catch (error) {
    return handleApiError(error);
  }
}
