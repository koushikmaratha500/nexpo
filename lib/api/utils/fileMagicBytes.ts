import { HttpError } from '@/lib/api/middleware/errorHandler';

const SIGNATURES: { mime: string; bytes: number[] }[] = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
];

export function detectMimeFromBuffer(buffer: Buffer): string | null {
  for (const sig of SIGNATURES) {
    if (buffer.length < sig.bytes.length) continue;
    const matches = sig.bytes.every((byte, index) => buffer[index] === byte);
    if (matches) return sig.mime;
  }

  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }

  return null;
}

export function assertBufferMatchesMime(buffer: Buffer, declaredMime: string): void {
  const detected = detectMimeFromBuffer(buffer);
  if (!detected) {
    throw new HttpError(415, 'Upload file content is not a supported image or PDF');
  }
  if (detected !== declaredMime) {
    throw new HttpError(415, 'Upload file content does not match its declared type');
  }
}
