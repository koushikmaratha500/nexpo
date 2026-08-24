import { describe, expect, it } from 'vitest';
import { HttpError } from '@/lib/api/middleware/errorHandler';
import {
  UPLOAD_MAX_BYTES,
  validateUploadFile,
} from '@/lib/api/utils/fileUpload';

function mockFile(type: string, size: number): File {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], 'test.bin', { type });
}

describe('validateUploadFile', () => {
  it('accepts allowed MIME types', () => {
    expect(() => validateUploadFile(mockFile('image/jpeg', 100))).not.toThrow();
    expect(() => validateUploadFile(mockFile('application/pdf', 100))).not.toThrow();
  });

  it('rejects disallowed MIME types with 415', () => {
    try {
      validateUploadFile(mockFile('application/octet-stream', 100));
      expect.fail('expected throw');
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
      expect((e as HttpError).status).toBe(415);
    }
  });

  it('rejects oversized files with 413', () => {
    try {
      validateUploadFile(mockFile('image/png', UPLOAD_MAX_BYTES + 1));
      expect.fail('expected throw');
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
      expect((e as HttpError).status).toBe(413);
    }
  });
});
