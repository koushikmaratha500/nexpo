import { HttpError } from '@/lib/api/middleware/errorHandler';
import { StorageService } from '@/lib/api/services/storage.service';

/** MIME types allowed for transaction/document uploads (server-validated). */
export const UPLOAD_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export type UploadAllowedMimeType = (typeof UPLOAD_ALLOWED_MIME_TYPES)[number];

export function validateUploadFile(file: File): void {
  if (!UPLOAD_ALLOWED_MIME_TYPES.includes(file.type as UploadAllowedMimeType)) {
    throw new HttpError(415, 'Upload supports JPG, PNG, WEBP, or PDF only');
  }
  if (file.size > UPLOAD_MAX_BYTES) {
    throw new HttpError(413, 'File is too large (max 10 MB)');
  }
}

export async function uploadValidatedFormFile(file: File) {
  validateUploadFile(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  return StorageService.uploadFile(buffer, file.name, file.type);
}
