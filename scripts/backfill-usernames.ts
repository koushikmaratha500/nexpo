import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { normalizeUsername } from '../lib/api/utils/username';

function slugFromEmail(email: string) {
  const local = email.split('@')[0] || 'user';
  return local.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 24);
}

async function nextAvailableUsername(base: string) {
  let candidate = base;
  let suffix = 1;
  while (true) {
    const existing = await prisma.user.findFirst({
      where: { username: { equals: candidate, mode: 'insensitive' } },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${base}_${suffix}`;
    suffix += 1;
  }
}

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [{ username: null }, { username: '' }],
    },
    select: { id: true, email: true, firstName: true },
  });

  let updated = 0;
  for (const user of users) {
    const base = user.email
      ? slugFromEmail(user.email)
      : normalizeUsername(user.firstName || 'user');
    const username = await nextAvailableUsername(base);
    await prisma.user.update({
      where: { id: user.id },
      data: { username },
    });
    updated += 1;
    console.log(`Set username for ${user.id}: ${username}`);
  }

  console.log(`Backfill complete. Updated ${updated} user(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
