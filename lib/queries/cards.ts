import { createClient } from '@/lib/supabase/server';

export interface PlayerCardRecord {
  player_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  club_id: string;
  club_name: string;
  club_logo: string | null;
  yellow_cards: number;
  red_cards: number;
  second_yellows: number;
}

export async function getCardsByTournament(tournamentId: string): Promise<PlayerCardRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('match_events')
    .select(`
      type,
      player:players(id, first_name, last_name, photo_url, club_id),
      club:clubs(id, name, logo_url),
      match:matches!inner(tournament_id)
    `)
    .eq('match.tournament_id', tournamentId)
    .in('type', ['yellow_card', 'second_yellow', 'red_card']);

  if (error) return [];

  const map = new Map<string, PlayerCardRecord>();
  for (const row of data ?? []) {
    const player = row.player as any;
    const club = row.club as any;
    if (!player?.id) continue;
    if (!map.has(player.id)) {
      map.set(player.id, {
        player_id: player.id,
        first_name: player.first_name,
        last_name: player.last_name,
        photo_url: player.photo_url,
        club_id: club?.id ?? player.club_id,
        club_name: club?.name ?? '',
        club_logo: club?.logo_url ?? null,
        yellow_cards: 0,
        red_cards: 0,
        second_yellows: 0,
      });
    }
    const rec = map.get(player.id)!;
    if (row.type === 'yellow_card') rec.yellow_cards++;
    else if (row.type === 'second_yellow') rec.second_yellows++;
    else if (row.type === 'red_card') rec.red_cards++;
  }

  return Array.from(map.values()).sort(
    (a, b) => (b.yellow_cards + b.red_cards + b.second_yellows) - (a.yellow_cards + a.red_cards + a.second_yellows)
  );
}
