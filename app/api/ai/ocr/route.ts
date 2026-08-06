import { NextRequest, NextResponse } from 'next/server';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError, HttpError } from '@/lib/api/middleware/errorHandler';
import { checkRateLimit } from '@/lib/api/middleware/rateLimiter';
import { AiUsageRepository } from '@/lib/api/repositories/aiUsage.repository';
import { getAiConfig } from '@/lib/ai/config';
import { extractReceipt } from '@/lib/ai/agents/receipt.agent';
import { toProviderHttpError, unwrapProviderError } from '@/lib/ai/errors';

const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const OCR_DAILY_LIMIT = 50;
const OCR_WINDOW_SECONDS = 24 * 60 * 60;

function parseNameList(raw: FormDataEntryValue | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) throw new Error('Not an array');
    return parsed.filter((n): n is string => typeof n === 'string').slice(0, 100);
  } catch {
    throw new HttpError(422, 'categories/paymentTypes must be a JSON array of names');
  }
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  let userId: string | undefined;

  try {
    const user = await authGuard(req, 'CUSTOMER');
    userId = user.id;

    await checkRateLimit(req, `ai_ocr:${user.id}`, {
      limit: OCR_DAILY_LIMIT,
      windowSeconds: OCR_WINDOW_SECONDS,
    });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      throw new HttpError(400, 'No file uploaded');
    }
    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
      throw new HttpError(415, 'AI extraction supports JPG, PNG or WEBP images only');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new HttpError(413, 'File is too large for AI extraction (max 10 MB)');
    }

    const categoryNames = parseNameList(formData.get('categories'));
    const paymentTypeNames = parseNameList(formData.get('paymentTypes'));

    const imageBase64 = Buffer.from(await file.arrayBuffer()).toString('base64');

    const { extraction, inputTokens, outputTokens } = await extractReceipt({
      imageBase64,
      mimeType: file.type,
      categoryNames,
      paymentTypeNames,
    });

    await AiUsageRepository.create({
      userId: user.id,
      feature: 'ocr',
      model: getAiConfig().modelFor('ocr'),
      inputTokens,
      outputTokens,
      latencyMs: Date.now() - startedAt,
      status: 'OK',
    });

    return NextResponse.json({ extraction });
  } catch (error) {
    if (userId && !(error instanceof HttpError && error.status === 429)) {
      await AiUsageRepository.create({
        userId,
        feature: 'ocr',
        model: getAiConfig().modelFor('ocr'),
        latencyMs: Date.now() - startedAt,
        status: 'ERROR',
        error: unwrapProviderError(error).message.slice(0, 500),
      }).catch(() => {
        // Audit logging must never mask the original error.
      });
    }
    return handleApiError(toProviderHttpError(error) ?? unwrapProviderError(error));
  }
}
