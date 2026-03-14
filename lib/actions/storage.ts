'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export type StorageBucket = 'logos' | 'photos' | 'news' | 'covers';

/**
 * Sube un archivo a Supabase Storage y retorna la URL pública.
 * Usa el service role client para saltear las RLS de storage.
 */
export async function uploadImage(
  formData: FormData,
  bucket: StorageBucket,
): Promise<{ url: string } | { error: string }> {
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { error: 'No se seleccionó archivo' };

  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSize) return { error: 'El archivo supera 5 MB' };

  if (!file.type.startsWith('image/')) return { error: 'Tipo de archivo no permitido' };

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { error: error.message };

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl };
}
