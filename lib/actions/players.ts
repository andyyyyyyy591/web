'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isTeamAdmin, getAdminClubId } from '@/lib/utils/auth';
import type { CreatePlayerPayload, UpdatePlayerPayload } from '@/types';

export async function createPlayer(payload: CreatePlayerPayload) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // team_admin solo puede crear jugadores de su club
  if (isTeamAdmin(user)) {
    const allowedClubId = getAdminClubId(user);
    if (allowedClubId !== payload.club_id) {
      return { error: 'No autorizado: solo puedes crear jugadores de tu propio club' };
    }
  }

  const { data, error } = await supabase
    .from('players')
    .insert(payload)
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath('/admin/jugadores');
  return { data };
}

export async function updatePlayer(id: string, payload: UpdatePlayerPayload) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Para team_admin, verificar que el jugador pertenece a su club
  if (isTeamAdmin(user)) {
    const allowedClubId = getAdminClubId(user);
    const { data: player } = await supabase
      .from('players')
      .select('club_id')
      .eq('id', id)
      .single();
    if (!player || player.club_id !== allowedClubId) {
      return { error: 'No autorizado: este jugador no pertenece a tu club' };
    }
  }

  const { error } = await supabase.from('players').update(payload).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/jugadores');
  return { success: true };
}
