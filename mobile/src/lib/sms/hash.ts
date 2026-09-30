import * as Crypto from 'expo-crypto';

export async function computeSmsMessageHash(params: {
  userId: string;
  sender: string;
  body: string;
  receivedAt: string | Date;
}): Promise<string> {
  const received =
    params.receivedAt instanceof Date
      ? params.receivedAt.toISOString()
      : new Date(params.receivedAt).toISOString();
  const payload = `${params.userId}|${params.sender.trim()}|${params.body.trim()}|${received}`;
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, payload);
}
