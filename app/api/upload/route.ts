import { NextRequest, NextResponse } from 'next/server';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { StorageService } from '@/lib/api/services/storage.service';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user/admin session using the bearer token
    await authGuard(req);

    // Parse multipart/form-data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string | null) || 'nexpo';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to Buffer for backend StorageService
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await StorageService.uploadFile(buffer, file.name, file.type, bucket);

    return NextResponse.json({
      url: result.url,
      path: result.path,
      name: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
