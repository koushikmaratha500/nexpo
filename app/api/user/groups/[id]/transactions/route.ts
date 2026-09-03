import { NextRequest } from 'next/server';
import { GroupTransactionController } from '@/lib/api/controllers/group-transaction.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '@/lib/api/middleware/rateLimiter';
import { uploadValidatedFormFile } from '@/lib/api/utils/fileUpload';

export async function GET(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const user = await authGuard(req, 'CUSTOMER');
    return await GroupTransactionController.list(req, id, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const user = await authGuard(req, 'CUSTOMER');
    await checkRateLimit(req, `group_txn_write:${user.id}`, RATE_LIMIT_PRESETS.transactionWrite);

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      const body: Record<string, unknown> = {};
      for (const [key, value] of formData.entries()) {
        if (key !== 'file') {
          body[key] = value;
        }
      }

      if (body.amount) body.amount = parseFloat(String(body.amount));
      if (body.documentSize) body.documentSize = parseInt(String(body.documentSize), 10);

      if (file) {
        const uploadResult = await uploadValidatedFormFile(file);
        body.documentUrl = uploadResult.url;
        body.documentFileName = file.name;
        body.documentMimeType = file.type;
        body.documentSize = file.size;
      }

      return await GroupTransactionController.createFromParsed(body, id, user.id, req);
    }

    return await GroupTransactionController.create(req, id, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
