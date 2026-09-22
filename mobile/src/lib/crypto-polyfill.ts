/**
 * Supabase PKCE requires WebCrypto (crypto.subtle.digest). Load before @supabase/supabase-js.
 */
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import * as ExpoCrypto from 'expo-crypto';

type CryptoWithSubtle = Crypto & {
  subtle?: SubtleCrypto;
};

const subtle = {
  async digest(algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer> {
    const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
    if (name !== 'SHA-256') {
      throw new Error(`Unsupported algorithm: ${String(name)}`);
    }

    const bytes =
      data instanceof ArrayBuffer
        ? new Uint8Array(data)
        : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

    return ExpoCrypto.digest(ExpoCrypto.CryptoDigestAlgorithm.SHA256, bytes);
  },
} as SubtleCrypto;

const existing = (globalThis as typeof globalThis & { crypto?: CryptoWithSubtle }).crypto;

if (!existing?.subtle) {
  const cryptoObject: CryptoWithSubtle = existing ?? ({} as CryptoWithSubtle);
  Object.defineProperty(cryptoObject, 'subtle', {
    value: subtle,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'crypto', {
    value: cryptoObject,
    configurable: true,
  });
}
