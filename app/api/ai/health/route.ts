import { NextRequest, NextResponse } from 'next/server';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { getAiConfig, isAiConfigured, type ModelKind } from '@/lib/ai/config';

const MODEL_KINDS: ModelKind[] = ['ocr', 'chat', 'structured'];

export async function GET(req: NextRequest) {
  try {
    await authGuard(req, 'CUSTOMER');
    const { modelFor } = getAiConfig();
    return NextResponse.json({
      enabled: isAiConfigured(),
      provider: 'openrouter',
      models: Object.fromEntries(MODEL_KINDS.map((k) => [k, modelFor(k)])),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
