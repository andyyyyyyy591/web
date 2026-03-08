import { createClient } from '@/lib/supabase/server';
import type { StandingWithClub } from '@/types';

export async function getStandingsByTournament(tournamentId: string): Promise<StandingWithClub[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('standings')
    .select('*, club:clubs(*)')
    .eq('tournament_id', tournamentId)
    .order('points', { ascending: false })
    .order('goal_difference', { ascending: false })
    .order('goals_for', { ascending: false });
  if (error) throw new Error(error.message);
  return data as StandingWithClub[];
}

export async function recalculateStandings(tournamentId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('recalculate_tournament_standings', {
    p_tournament_id: tournamentId,
  });
  if (error) throw new Error(error.message);
}
