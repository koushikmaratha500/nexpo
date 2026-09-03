import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { HttpError } from '@/lib/api/middleware/errorHandler';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
const uploadBucket = process.env.SUPABASE_UPLOAD_BUCKET?.trim() || 'nexpo';

function createStorageClient(): SupabaseClient | null {
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

const supabase = createStorageClient();

export class StorageService {
  static async uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string) {
    if (!supabase) {
      const message =
        process.env.NODE_ENV === 'production'
          ? 'File storage is not configured. Set SUPABASE_SERVICE_ROLE_KEY in production.'
          : 'File storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.';
      throw new HttpError(503, message);
    }

    const filePath = `${Date.now()}_${fileName.replace(/\s+/g, '_')}`;
    const { data, error } = await supabase.storage
      .from(uploadBucket)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      throw new HttpError(500, error.message || 'Upload failed');
    }

    const { data: publicData } = supabase.storage.from(uploadBucket).getPublicUrl(filePath);

    return {
      url: publicData.publicUrl,
      path: data.path,
    };
  }
}
