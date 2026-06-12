import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('CRITICAL DATABASE ERROR: DATABASE_URL environment variable is undefined. Falling back to localhost:5432. If you recently updated your .env file, please restart your development server ("npm run dev").');
  }
  const fallback = 'postgresql://postgres:postgres@localhost:5432/nexpo?schema=public';
  const pool = new Pool({ connectionString: connectionString || fallback });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
