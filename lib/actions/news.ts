'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { CreateNewsPayload } from '@/types';

export async function createNews(payload: CreateNewsPayload) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('news')
    .insert(payload)
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath('/admin/noticias');
  revalidatePath('/noticias');
  revalidatePath('/');
  return { data };
}

export async function updateNews(id: string, payload: Partial<CreateNewsPayload>) {
  const supabase = await createClient();
  const { error } = await supabase.from('news').update(payload).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/noticias');
  revalidatePath('/noticias');
  revalidatePath('/');
  return { success: true };
}

export async function deleteNews(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('news').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/noticias');
  revalidatePath('/noticias');
  revalidatePath('/');
  return { success: true };
}
