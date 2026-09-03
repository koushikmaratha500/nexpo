import { describe, expect, it } from 'vitest';
import { assertBufferMatchesMime, detectMimeFromBuffer } from '@/lib/api/utils/fileMagicBytes';

describe('fileMagicBytes', () => {
  it('detects JPEG signature', () => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
    expect(detectMimeFromBuffer(buffer)).toBe('image/jpeg');
  });

  it('rejects mismatched declared mime', () => {
    const buffer = Buffer.from('%PDF-1.4\n');
    expect(() => assertBufferMatchesMime(buffer, 'image/jpeg')).toThrow(/does not match/);
  });

  it('accepts matching PDF buffer', () => {
    const buffer = Buffer.from('%PDF-1.4\n');
    expect(() => assertBufferMatchesMime(buffer, 'application/pdf')).not.toThrow();
  });
});
