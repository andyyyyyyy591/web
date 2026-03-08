'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { TournamentFormat } from '@/types';

export async function updateTournamentFormat(tournamentId: string, format: TournamentFormat) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('tournaments')
    .update({ format })
    .eq('id', tournamentId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/torneos/${tournamentId}`);
  return { success: true };
}

export interface TournamentClubForFixture {
  club_id: string;
  club_name: string;
  zone: string | null;
}

export async function getTournamentClubsForFixture(
  tournamentId: string,
): Promise<TournamentClubForFixture[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tournament_clubs')
    .select('club_id, zone, club:clubs(name)')
    .eq('tournament_id', tournamentId)
    .order('zone', { ascending: true, nullsFirst: true });
  if (error || !data) return [];
  return data.map((r: any) => ({
    club_id: r.club_id,
    club_name: r.club?.name ?? '',
    zone: r.zone ?? null,
  }));
}
