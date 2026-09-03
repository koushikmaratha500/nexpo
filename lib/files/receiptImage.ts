/** MIME types supported by POST /api/ai/ocr */
export const OCR_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type OcrImageMimeType = (typeof OCR_IMAGE_MIME_TYPES)[number];

const EXTENSION_TO_MIME: Record<string, OcrImageMimeType> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function extensionFromName(name: string): string | null {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return null;
  return name.slice(dot + 1).toLowerCase();
}

/** Resolve OCR MIME from File.type or filename extension (handles empty browser MIME). */
export function inferOcrImageMimeType(file: Pick<File, 'name' | 'type'>): OcrImageMimeType | null {
  const normalized = file.type?.toLowerCase().trim();
  if (normalized && OCR_IMAGE_MIME_TYPES.includes(normalized as OcrImageMimeType)) {
    return normalized as OcrImageMimeType;
  }

  const ext = extensionFromName(file.name);
  if (!ext) return null;
  return EXTENSION_TO_MIME[ext] ?? null;
}

export function isOcrSupportedImageFile(file: Pick<File, 'name' | 'type'>): boolean {
  return inferOcrImageMimeType(file) !== null;
}

/** Ensure FormData sends a MIME the OCR route accepts. */
export function fileForOcrUpload(file: File): File {
  const mime = inferOcrImageMimeType(file);
  if (!mime) return file;
  if (file.type === mime) return file;
  return new File([file], file.name, { type: mime, lastModified: file.lastModified });
}
