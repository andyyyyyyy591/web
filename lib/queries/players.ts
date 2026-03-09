import { createClient } from '@/lib/supabase/server';
import type { Player, PlayerWithClub, TopScorer, MatchWithClubs } from '@/types';

export async function getPlayersByClub(clubId: string): Promise<Player[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('club_id', clubId)
    .eq('is_active', true)
    .order('last_name');
  if (error) throw new Error(error.message);
  return data;
}

export async function getPlayerById(id: string): Promise<PlayerWithClub | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('players')
    .select('*, club:clubs(*)')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as PlayerWithClub;
}

export async function getTopScorersByTournament(tournamentId: string): Promise<TopScorer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('top_scorers')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('goals', { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return data;
}

export async function getAllPlayers(): Promise<PlayerWithClub[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('players')
    .select('*, club:clubs(*)')
    .eq('is_active', true)
    .order('last_name');
  if (error) throw new Error(error.message);
  return data as PlayerWithClub[];
}

export async function getPlayersByClubInPrimera(clubId: string): Promise<Player[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('club_id', clubId)
    .eq('is_active', true)
    .eq('plays_in_primera', true)
    .order('last_name');
  if (error) return [];
  return data;
}

export interface PlayerWithDivision extends Player {
  primary_division_label: string | null;
  primary_division_slug: string | null;
}

export async function getPlayersByClubWithDivision(clubId: string): Promise<PlayerWithDivision[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('players')
    .select('*, primary_division:divisions(label, slug)')
    .eq('club_id', clubId)
    .eq('is_active', true)
    .order('last_name');
  return (data ?? []).map((p: any) => ({
    ...p,
    primary_division_label: p.primary_division?.label ?? null,
    primary_division_slug: p.primary_division?.slug ?? null,
  }));
}

export async function getPlayerMatchHistory(playerId: string): Promise<MatchWithClubs[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('match_lineups')
    .select(`
      match:matches(
        *,
        home_club:clubs!matches_home_club_id_fkey(*),
        away_club:clubs!matches_away_club_id_fkey(*),
        tournament:tournaments(*, season:seasons(*), division:divisions(*)),
        match_date:match_dates(*)
      )
    `)
    .eq('player_id', playerId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? [])
    .map((row: any) => row.match)
    .filter(Boolean) as MatchWithClubs[];
}

export interface PlayerStats {
  goals: number;
  ownGoals: number;
  matches: number;
  yellowCards: number;
  redCards: number;
}

export async function getPlayerStats(playerId: string): Promise<PlayerStats> {
  const supabase = await createClient();

  const [eventsRes, lineupsRes] = await Promise.all([
    supabase
      .from('match_events')
      .select('type')
      .eq('player_id', playerId),
    supabase
      .from('match_lineups')
      .select('id')
      .eq('player_id', playerId),
  ]);

  const events = eventsRes.data ?? [];
  return {
    goals: events.filter((e) => e.type === 'goal' || e.type === 'penalty_goal').length,
    ownGoals: events.filter((e) => e.type === 'own_goal').length,
    matches: lineupsRes.data?.length ?? 0,
    yellowCards: events.filter((e) => e.type === 'yellow_card' || e.type === 'second_yellow').length,
    redCards: events.filter((e) => e.type === 'red_card' || e.type === 'second_yellow').length,
  };
}
