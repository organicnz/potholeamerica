import { supabaseClient } from '@/lib/supabase/client';

export interface UploadCaseMediaParams {
  file: File | Blob;
  publicId: string;
}

export interface UploadResult {
  storagePath: string;
  publicUrl: string;
}

/**
 * Uploads citizen hazard proof images directly to Supabase S3-compatible Storage (bucket: case-media)
 */
export async function uploadCaseMedia({
  file,
  publicId,
}: UploadCaseMediaParams): Promise<UploadResult> {
  const fileExt = file instanceof File ? file.name.split('.').pop() || 'jpg' : 'webp';
  const filename = `hazards/${publicId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExt}`;

  const { data, error } = await supabaseClient.storage.from('case-media').upload(filename, file, {
    contentType: file.type || 'image/jpeg',
    cacheControl: '31536000',
    upsert: false,
  });

  if (error) {
    throw new Error(`Failed to upload hazard photo to Supabase S3 storage: ${error.message}`);
  }

  const { data: publicData } = supabaseClient.storage.from('case-media').getPublicUrl(data.path);

  return {
    storagePath: data.path,
    publicUrl: publicData.publicUrl,
  };
}
