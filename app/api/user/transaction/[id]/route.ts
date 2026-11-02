import { NextRequest } from 'next/server';
import { TransactionController } from '@/lib/api/controllers/transaction.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '@/lib/api/middleware/rateLimiter';
import { uploadValidatedFormFile } from '@/lib/api/utils/fileUpload';

export async function GET(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const user = await authGuard(req, 'CUSTOMER');
    return await TransactionController.getById(req, id, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const user = await authGuard(req, 'CUSTOMER');
    await checkRateLimit(req, `txn_write:${user.id}`, RATE_LIMIT_PRESETS.transactionWrite);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    const body: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      if (key === 'file') continue;
      if (typeof value === 'string' && value.trim() === '') continue;
      body[key] = value;
    }

    if (body.amount != null && body.amount !== '') {
      body.amount = parseFloat(String(body.amount));
    }
    if (body.documentSize != null && body.documentSize !== '') {
      body.documentSize = parseInt(String(body.documentSize), 10);
    }
    if (body.isRecurring !== undefined) {
      body.isRecurring = ['true', '1', 'yes'].includes(String(body.isRecurring).toLowerCase());
    }
    if (body.recurringDay !== undefined) {
      body.recurringDay =
        body.recurringDay === '' || body.recurringDay == null
          ? null
          : parseInt(String(body.recurringDay), 10);
    }

    if (file) {
      const uploadResult = await uploadValidatedFormFile(file);
      body.documentUrl = uploadResult.url;
      body.documentFileName = file.name;
      body.documentMimeType = file.type;
      body.documentSize = file.size;
    }

    return await TransactionController.updateFromParsed(body, id, user.id, req);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const user = await authGuard(req, 'CUSTOMER');
    await checkRateLimit(req, `txn_write:${user.id}`, RATE_LIMIT_PRESETS.transactionWrite);
    return await TransactionController.delete(req, id, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
