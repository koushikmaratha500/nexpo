import { prisma } from '@/lib/prisma';

async function main() {
  const rows = await prisma.aiUsage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  console.log('total AiUsage rows:', await prisma.aiUsage.count());
  for (const r of rows) {
    console.log(
      `- ${r.createdAt.toISOString()} | ${r.feature} | ${r.model} | in:${r.inputTokens} out:${r.outputTokens} | ${r.latencyMs}ms | ${r.status}${r.error ? ' | ' + r.error : ''}`
    );
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('FAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});
