import { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/api/middleware/rateLimiter';

async function main() {
  const req = new NextRequest('http://localhost:3000/api/ai/ocr');
  const identifier = `test-rl-probe:${Date.now()}`;

  for (let i = 1; i <= 4; i++) {
    try {
      await checkRateLimit(req, identifier, { limit: 3, windowSeconds: 86400 });
      console.log(`attempt ${i}: passed`);
    } catch (err) {
      const status = err instanceof Error && 'status' in err ? (err as { status?: number }).status : '?';
      console.log(`attempt ${i}: REJECTED http:${status} - ${err instanceof Error ? err.message : err}`);
    }
  }
}

main().catch((err) => {
  console.error('FAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});
