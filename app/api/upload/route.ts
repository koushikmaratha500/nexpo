import { NextRequest, NextResponse } from 'next/server';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '@/lib/api/middleware/rateLimiter';
import { uploadValidatedFormFile } from '@/lib/api/utils/fileUpload';

export async function POST(req: NextRequest) {
  try {
    const user = await authGuard(req);
    await checkRateLimit(req, `upload:${user.id}`, RATE_LIMIT_PRESETS.upload);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const result = await uploadValidatedFormFile(file);

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
