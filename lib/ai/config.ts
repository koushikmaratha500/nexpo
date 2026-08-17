export type ModelKind = 'ocr' | 'chat' | 'structured';

const MODEL_MAP: Record<ModelKind, string> = {
  ocr: 'google/gemma-4-26b-a4b-it:free',
  chat: 'openrouter/free',
  structured: 'openrouter/free',
};

export interface AiConfig {
  apiKey: string;
  enabled: boolean;
  modelFor(kind: ModelKind): string;
}

export function getAiConfig(): AiConfig {
  const apiKey = process.env.OPENROUTER_API_KEY || '';
  const enabled = process.env.AI_ENABLED !== 'false';

  return {
    apiKey,
    enabled,
    modelFor: (kind) =>
      process.env[`AI_MODEL_${kind.toUpperCase()}`] || MODEL_MAP[kind],
  };
}

export function isAiConfigured(): boolean {
  const { enabled, apiKey } = getAiConfig();
  return enabled && apiKey.length > 0;
}

export function modelListFor(kind: ModelKind): string[] {
  const override = process.env[`AI_MODEL_${kind.toUpperCase()}`];
  const raw = override || MODEL_MAP[kind];
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}
