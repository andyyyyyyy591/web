import { createClient } from '@/lib/supabase/server';
import type { News } from '@/types';

export async function getPublishedNews(limit = 20): Promise<News[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

export async function getNewsBySlug(slug: string): Promise<News | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  if (error) return null;
  return data;
}

/** Para el admin: trae todas (publicadas y borradores) */
export async function getAllNews(): Promise<News[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getNewsById(id: string): Promise<News | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}
