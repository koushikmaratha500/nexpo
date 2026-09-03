import { describe, expect, it } from 'vitest';
import { fileForOcrUpload, inferOcrImageMimeType, isOcrSupportedImageFile } from '@/lib/files/receiptImage';

describe('receiptImage', () => {
  it('detects JPEG by extension when MIME is empty', () => {
    const file = new File(['x'], 'receipt.jpg', { type: '' });
    expect(isOcrSupportedImageFile(file)).toBe(true);
    expect(inferOcrImageMimeType(file)).toBe('image/jpeg');
  });

  it('rejects PDF attachments for OCR', () => {
    const file = new File(['x'], 'receipt.pdf', { type: 'application/pdf' });
    expect(isOcrSupportedImageFile(file)).toBe(false);
  });

  it('normalizes empty MIME on upload wrapper', () => {
    const file = new File(['x'], 'scan.png', { type: '' });
    expect(fileForOcrUpload(file).type).toBe('image/png');
  });
});
