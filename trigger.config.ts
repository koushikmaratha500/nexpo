import { defineConfig } from '@trigger.dev/sdk';
import { syncEnvVars } from '@trigger.dev/build/extensions/core';
import { prismaExtension } from '@trigger.dev/build/extensions/prisma';

const HEALTH_ENV_KEYS = [
  'DATABASE_URL',
  'DIRECT_URL',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'ENABLE_RESEND',
  'RESEND_API_KEY',
  'ONESIGNAL_APP_ID',
  'ONESIGNAL_REST_API_KEY',
  'OPENROUTER_API_KEY',
  'AI_ENABLED',
] as const;

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF ?? 'proj_wsuptnvrcwjcvnlmdfxn',
  // Prisma 7 rejects Trigger.dev's default Node 21.7.3 runtime.
  runtime: 'node-22',
  dirs: ['./trigger'],
  maxDuration: 60,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  build: {
    external: ['pg', '@prisma/adapter-pg'],
    extensions: [
      prismaExtension({
        mode: 'legacy',
        schema: 'prisma/schema.prisma',
      }),
      syncEnvVars(async () =>
        Object.fromEntries(
          HEALTH_ENV_KEYS.flatMap((key) => {
            const value = process.env[key];
            return value ? [[key, value]] : [];
          }),
        ),
      ),
    ],
  },
});
