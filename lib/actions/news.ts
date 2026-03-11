'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { CreateNewsPayload } from '@/types';

/** After create/update, scan title+content for club names and sync news_clubs */
async function syncNewsClubs(newsId: string, title: string, content: string) {
  try {
    const supabase = await createClient();

    const { data: clubs } = await supabase
      .from('clubs')
      .select('id, name, short_name')
      .eq('is_active', true);

    if (!clubs || clubs.length === 0) return;

    const text = `${title} ${content}`.toLowerCase();
    const matchedIds = clubs
      .filter((c) =>
        text.includes(c.name.toLowerCase()) ||
        (c.short_name && text.includes(c.short_name.toLowerCase()))
      )
      .map((c) => c.id);

    await supabase.from('news_clubs').delete().eq('news_id', newsId);

    if (matchedIds.length > 0) {
      await supabase
        .from('news_clubs')
        .insert(matchedIds.map((clubId) => ({ news_id: newsId, club_id: clubId })));
    }
  } catch {
    // Don't let club-linking errors break news creation
  }
}

export async function createNews(payload: CreateNewsPayload) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('news')
    .insert(payload)
    .select()
    .single();
  if (error) return { error: error.message };

  await syncNewsClubs(data.id, payload.title, payload.content);

  revalidatePath('/admin/noticias');
  revalidatePath('/noticias');
  revalidatePath('/');
  return { data };
}

export async function updateNews(id: string, payload: Partial<CreateNewsPayload>) {
  const supabase = await createClient();
  const { error } = await supabase.from('news').update(payload).eq('id', id);
  if (error) return { error: error.message };

  if (payload.title !== undefined || payload.content !== undefined) {
    // Re-sync clubs if title or content changed
    const { data: news } = await supabase
      .from('news')
      .select('title, content')
      .eq('id', id)
      .single();
    if (news) await syncNewsClubs(id, news.title, news.content);
  }

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
