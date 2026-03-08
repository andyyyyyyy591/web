'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';

export async function addClubToTournament(tournamentId: string, clubId: string, zone: string | null) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('tournament_clubs')
    .upsert({ tournament_id: tournamentId, club_id: clubId, zone: zone || null },
      { onConflict: 'tournament_id,club_id' });
  if (error) return { error: error.message };
  revalidatePath(`/admin/torneos/${tournamentId}`);
  return { success: true };
}

export async function removeClubFromTournament(tournamentClubId: string, tournamentId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('tournament_clubs').delete().eq('id', tournamentClubId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/torneos/${tournamentId}`);
  return { success: true };
}

export async function updateClubZone(tournamentClubId: string, zone: string | null, tournamentId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('tournament_clubs')
    .update({ zone: zone || null })
    .eq('id', tournamentClubId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/torneos/${tournamentId}`);
  return { success: true };
}
