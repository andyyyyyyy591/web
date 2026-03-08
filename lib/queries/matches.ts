import { createClient } from '@/lib/supabase/server';
import type {
  LiveMatch,
  MatchDetail,
  MatchWithClubs,
  MatchDateWithMatches,
} from '@/types';

const MATCH_WITH_CLUBS_SELECT = `
  *,
  home_club:clubs!matches_home_club_id_fkey(*),
  away_club:clubs!matches_away_club_id_fkey(*),
  tournament:tournaments(*, season:seasons(*), division:divisions(*)),
  match_date:match_dates(*)
`;

export async function getLiveMatches(): Promise<LiveMatch[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('live_matches')
    .select('*');
  if (error) throw new Error(error.message);
  return data;
}

export async function getMatchById(id: string): Promise<MatchDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('matches')
    .select(`
      ${MATCH_WITH_CLUBS_SELECT},
      events:match_events(
        *,
        player:players!match_events_player_id_fkey(*),
        secondary_player:players!match_events_secondary_player_id_fkey(*),
        club:clubs(*)
      ),
      lineups:match_lineups(*, player:players(*))
    `)
    .eq('id', id)
    .single();

  if (error) return null;

  const lineups = (data.lineups ?? []) as Array<{
    club_id: string;
    is_starter: boolean;
    player: { id: string };
    [key: string]: unknown;
  }>;

  const homeId = data.home_club_id as string;
  const awayId = data.away_club_id as string;

  return {
    ...data,
    events: (data.events ?? []) as MatchDetail['events'],
    home_starters: (lineups.filter((l) => l.club_id === homeId && l.is_starter) as unknown) as MatchDetail['home_starters'],
    home_subs: (lineups.filter((l) => l.club_id === homeId && !l.is_starter) as unknown) as MatchDetail['home_subs'],
    away_starters: (lineups.filter((l) => l.club_id === awayId && l.is_starter) as unknown) as MatchDetail['away_starters'],
    away_subs: (lineups.filter((l) => l.club_id === awayId && !l.is_starter) as unknown) as MatchDetail['away_subs'],
  } as MatchDetail;
}

export async function getMatchesByTournament(tournamentId: string): Promise<MatchDateWithMatches[]> {
  const supabase = await createClient();
  const { data: dates, error: datesError } = await supabase
    .from('match_dates')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('number');
  if (datesError) throw new Error(datesError.message);

  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select(MATCH_WITH_CLUBS_SELECT)
    .eq('tournament_id', tournamentId)
    .order('scheduled_at');
  if (matchesError) throw new Error(matchesError.message);

  const allMatches = (matches ?? []) as MatchWithClubs[];
  const dateGroups = (dates ?? []).map((date) => ({
    ...date,
    matches: allMatches.filter((m) => m.match_date_id === date.id),
  }));

  // Partidos sin fecha asignada — los agrupamos aparte
  const assignedIds = new Set((dates ?? []).map((d) => d.id));
  const unassigned = allMatches.filter(
    (m) => !m.match_date_id || !assignedIds.has(m.match_date_id),
  );
  if (unassigned.length > 0) {
    dateGroups.push({
      id: '__unassigned__',
      tournament_id: tournamentId,
      number: 0,
      label: 'Sin fecha asignada',
      date: null,
      matches: unassigned,
    } as any);
  }

  return dateGroups;
}

export async function getUpcomingMatches(limit = 6): Promise<MatchWithClubs[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('matches')
    .select(MATCH_WITH_CLUBS_SELECT)
    .eq('status', 'scheduled')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at')
    .limit(limit);
  if (error) throw new Error(error.message);
  return data as MatchWithClubs[];
}

export async function getRecentResults(limit = 6): Promise<MatchWithClubs[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('matches')
    .select(MATCH_WITH_CLUBS_SELECT)
    .eq('status', 'finished')
    .order('finished_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data as MatchWithClubs[];
}

export async function getAllMatches(): Promise<MatchWithClubs[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('matches')
    .select(MATCH_WITH_CLUBS_SELECT)
    .order('scheduled_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as MatchWithClubs[];
}

export async function getMatchesByClub(clubId: string): Promise<MatchWithClubs[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('matches')
    .select(MATCH_WITH_CLUBS_SELECT)
    .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
    .order('scheduled_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as MatchWithClubs[];
}

export async function getMatchesByDate(date: string): Promise<MatchWithClubs[]> {
  const supabase = await createClient();
  // date format: YYYY-MM-DD
  const start = `${date}T00:00:00.000Z`;
  const end = `${date}T23:59:59.999Z`;
  const { data, error } = await supabase
    .from('matches')
    .select(MATCH_WITH_CLUBS_SELECT)
    .gte('scheduled_at', start)
    .lte('scheduled_at', end)
    .order('scheduled_at');
  if (error) throw new Error(error.message);
  return data as MatchWithClubs[];
}

export async function getRecentMatchesByClub(clubId: string, limit = 5): Promise<MatchWithClubs[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('matches')
    .select(MATCH_WITH_CLUBS_SELECT)
    .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
    .eq('status', 'finished')
    .order('finished_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data as MatchWithClubs[];
}
