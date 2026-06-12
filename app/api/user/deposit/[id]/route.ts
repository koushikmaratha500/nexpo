import { NextRequest } from 'next/server';
import { DepositController } from '@/lib/api/controllers/deposit.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { StorageService } from '@/lib/api/services/storage.service';

export async function GET(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const user = await authGuard(req, 'CUSTOMER');
    return await DepositController.getById(req, id, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
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
    if (body.documentSize) body.documentSize = parseInt(body.documentSize);

    // If a file is attached, upload it to Supabase storage first
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadResult = await StorageService.uploadFile(buffer, file.name, file.type, 'nexpo');
      body.documentUrl = uploadResult.url;
      body.documentFileName = file.name;
      body.documentMimeType = file.type;
      body.documentSize = file.size;
    }

    return await DepositController.updateFromParsed(body, id, user.id, req);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const user = await authGuard(req, 'CUSTOMER');
    return await DepositController.delete(req, id, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
