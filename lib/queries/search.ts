import { createClient } from '@/lib/supabase/server';
import type { Club, Player, News } from '@/types';

export interface SearchResults {
  clubs: Club[];
  players: Array<Player & { club_name: string }>;
  news: News[];
}

export async function search(query: string): Promise<SearchResults> {
  if (!query || query.trim().length < 2) {
    return { clubs: [], players: [], news: [] };
  }

  const q = query.trim();
  const supabase = await createClient();

  const [clubsRes, playersRes, newsRes] = await Promise.all([
    supabase
      .from('clubs')
      .select('*')
      .or(`name.ilike.%${q}%,short_name.ilike.%${q}%`)
      .limit(8),

    supabase
      .from('players')
      .select('*, club:clubs(name)')
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
      .limit(10),

    supabase
      .from('news')
      .select('*')
      .eq('is_published', true)
      .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`)
      .limit(6),
  ]);

  const players = (playersRes.data ?? []).map((p: any) => ({
    ...p,
    club_name: p.club?.name ?? '',
  }));

  return {
    clubs: clubsRes.data ?? [],
    players,
    news: newsRes.data ?? [],
  };
}
