import { NextRequest } from 'next/server';
import { TransactionController } from '@/lib/api/controllers/transaction.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { StorageService } from '@/lib/api/services/storage.service';

export async function POST(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    const body: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      if (key !== 'file') {
        body[key] = value;
      }
    }

    if (body.amount) body.amount = parseFloat(body.amount);
    if (body.documentSize) body.documentSize = parseInt(body.documentSize);

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadResult = await StorageService.uploadFile(buffer, file.name, file.type, 'nexpo');
      body.documentUrl = uploadResult.url;
      body.documentFileName = file.name;
      body.documentMimeType = file.type;
      body.documentSize = file.size;
    }

    return await TransactionController.createFromParsed(body, user.id, req);
  } catch (error) {
    return handleApiError(error);
  }
}
