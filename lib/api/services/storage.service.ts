import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Use service role key if available, otherwise fallback to public key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

export class StorageService {
  static async uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string, bucket = 'nexpo') {
    if (!supabase) {
      console.warn('Supabase credentials missing, falling back to mock file path');
      return { url: `/basic-text.pdf`, path: `mock/${fileName}` };
    }

    const filePath = `${Date.now()}_${fileName.replace(/\s+/g, '_')}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      if (error.message?.includes('row-level security') && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Upload failed: Row-level security (RLS) violation. Please configure SUPABASE_SERVICE_ROLE_KEY in your .env file to bypass RLS policies for server-side uploads.');
      }
      throw error;
    }

    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      url: publicData.publicUrl,
      path: data.path,
    };
  }
}
