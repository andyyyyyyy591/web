import { createClient } from '@/lib/supabase/server';
import type { TournamentWithRelations } from '@/types';

export async function getSeasonsWithTournaments() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('seasons')
    .select('*, tournaments(id, name, division:divisions(name))')
    .order('year', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Array<{
    id: string;
    name: string;
    year: number;
    start_date: string | null;
    end_date: string | null;
    tournaments: Array<{ id: string; name: string; division: { name: string } | null }>;
  }>;
}

export async function getTournaments(): Promise<TournamentWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tournaments')
    .select('*, season:seasons(*), division:divisions(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as TournamentWithRelations[];
}

export async function getMatchDatesByTournament(tournamentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('match_dates')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('number');
  if (error) throw new Error(error.message);
  return data;
}
