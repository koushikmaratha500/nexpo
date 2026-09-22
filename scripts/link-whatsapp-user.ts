import 'dotenv/config';
import { prisma } from '../lib/prisma';

/**
 * Dev helper: link a WhatsApp external_user_id to a Nexpo user.
 *
 * Usage:
 *   npx tsx scripts/link-whatsapp-user.ts <userId> <externalUserId>
 *
 * Example:
 *   npx tsx scripts/link-whatsapp-user.ts 550e8400-e29b-41d4-a716-446655440000 "201137630216422@lid"
 */

const [userId, externalUserId] = process.argv.slice(2);

if (!userId || !externalUserId) {
  console.error('Usage: npx tsx scripts/link-whatsapp-user.ts <userId> <externalUserId>');
  process.exit(1);
}

async function main() {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.error(`User not found: ${userId}`);
    process.exit(1);
  }

  const account = await prisma.channelAccount.upsert({
    where: { channel_externalUserId: { channel: 'WHATSAPP', externalUserId } },
    create: {
      userId,
      channel: 'WHATSAPP',
      externalUserId,
      status: 'LINKED',
      linkedAt: new Date(),
      lastSeenAt: new Date(),
    },
    update: {
      userId,
      status: 'LINKED',
      linkedAt: new Date(),
      lastSeenAt: new Date(),
    },
  });

  console.log('Linked WhatsApp account:');
  console.log(JSON.stringify(account, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
