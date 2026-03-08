import { createClient } from '@/lib/supabase/server';
import type { Club } from '@/types';

export interface TournamentClubWithClub {
  id: string;
  tournament_id: string;
  club_id: string;
  zone: string | null;
  club: Club;
}

export async function getClubsByTournament(tournamentId: string): Promise<TournamentClubWithClub[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tournament_clubs')
    .select('*, club:clubs(*)')
    .eq('tournament_id', tournamentId)
    .order('zone', { ascending: true, nullsFirst: true });
  if (error) return [];
  return data as TournamentClubWithClub[];
}

export async function getAllClubsForTournamentAdmin(tournamentId: string) {
  const supabase = await createClient();
  const [allClubsRes, registeredRes] = await Promise.all([
    supabase.from('clubs').select('*').order('name'),
    supabase.from('tournament_clubs').select('*, club:clubs(*)').eq('tournament_id', tournamentId),
  ]);
  return {
    allClubs: (allClubsRes.data ?? []) as Club[],
    registered: (registeredRes.data ?? []) as TournamentClubWithClub[],
  };
}
