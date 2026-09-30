import { prisma } from '@/lib/prisma';

export class TransactionImportFingerprintRepository {
  static async findByFingerprint(userId: string, fingerprint: string) {
    return prisma.transactionImportFingerprint.findUnique({
      where: { userId_fingerprint: { userId, fingerprint } },
    });
  }

  static async create(params: {
    userId: string;
    fingerprint: string;
    transactionId: string;
    source?: string;
  }) {
    return prisma.transactionImportFingerprint.create({
      data: {
        userId: params.userId,
        fingerprint: params.fingerprint,
        transactionId: params.transactionId,
        source: params.source ?? 'sms',
      },
    });
  }
}
