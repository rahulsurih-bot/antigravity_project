import { supabase } from '../../config/supabase.js';
import { env } from '../../config/env.js';
import crypto from 'crypto';

export async function uploadCropImage(buffer, originalName, mimeType, userId) {
  const extension = originalName.slice(originalName.lastIndexOf('.')).toLowerCase() || '.jpg';
  const uniqueId = crypto.randomUUID();
  const filePath = `${userId}/${uniqueId}${extension}`;

  if (supabase) {
    const { error } = await supabase.storage
      .from(env.UPLOAD_BUCKET)
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: false
      });

    if (error) {
      console.warn('[STORAGE UPLOAD ERROR]', error.message);
    }
  }

  // Return stored path
  return filePath;
}

export async function getImageUrl(filePath) {
  if (supabase && filePath) {
    // Generate private signed URL valid for 60 minutes
    const { data, error } = await supabase.storage
      .from(env.UPLOAD_BUCKET)
      .createSignedUrl(filePath, 3600);

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  }

  // Simulated fallback placeholder image URL
  return `/uploads/simulated/${filePath}`;
}
