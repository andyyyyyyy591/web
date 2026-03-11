import { createClient } from '@/lib/supabase/server';
import type { PlayerInjuryWithPlayer } from '@/types';

/** Lesiones activas de uno o varios clubes (para mostrar en el partido) */
export async function getActiveInjuriesByClubs(clubIds: string[]): Promise<PlayerInjuryWithPlayer[]> {
  if (!clubIds.length) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('player_injuries')
    .select('id, player_id, club_id, description, estimated_recovery, is_active, created_at, updated_at, player:players(id, first_name, last_name, photo_url)')
    .in('club_id', clubIds)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PlayerInjuryWithPlayer[];
}

/** Todas las lesiones de un club (activas e inactivas) — para el admin */
export async function getAllInjuriesByClub(clubId: string): Promise<PlayerInjuryWithPlayer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('player_injuries')
    .select('id, player_id, club_id, description, estimated_recovery, is_active, created_at, updated_at, player:players(id, first_name, last_name, photo_url)')
    .eq('club_id', clubId)
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PlayerInjuryWithPlayer[];
}
