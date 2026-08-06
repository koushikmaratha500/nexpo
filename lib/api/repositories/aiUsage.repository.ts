import { prisma } from '@/lib/prisma';

export interface CreateAiUsageInput {
  userId: string;
  feature: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
  status?: 'OK' | 'ERROR' | 'RATE_LIMITED';
  error?: string | null;
}

export class AiUsageRepository {
  static async create(data: CreateAiUsageInput): Promise<void> {
    await prisma.aiUsage.create({
      data: {
        userId: data.userId,
        feature: data.feature,
        model: data.model,
        inputTokens: data.inputTokens ?? 0,
        outputTokens: data.outputTokens ?? 0,
        latencyMs: data.latencyMs,
        status: data.status ?? 'OK',
        error: data.error ?? null,
      },
    });
  }
}
