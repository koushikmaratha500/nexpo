import { NextRequest } from 'next/server';
import { TransactionController } from '@/lib/api/controllers/transaction.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '@/lib/api/middleware/rateLimiter';
import { uploadValidatedFormFile } from '@/lib/api/utils/fileUpload';

export async function POST(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    await checkRateLimit(req, `txn_write:${user.id}`, RATE_LIMIT_PRESETS.transactionWrite);

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
    if (body.isRecurring !== undefined) {
      body.isRecurring = ['true', '1', 'yes'].includes(String(body.isRecurring).toLowerCase());
    }
    if (body.recurringDay !== undefined) {
      body.recurringDay = body.recurringDay === '' ? null : parseInt(body.recurringDay, 10);
    }

    if (file) {
      const uploadResult = await uploadValidatedFormFile(file);
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
