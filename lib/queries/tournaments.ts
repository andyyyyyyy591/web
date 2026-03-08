import { createClient } from '@/lib/supabase/server';
import type { TournamentWithRelations } from '@/types';

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
