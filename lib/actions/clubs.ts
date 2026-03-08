'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isTeamAdmin, getAdminClubId } from '@/lib/utils/auth';
import type { CreateClubPayload, UpdateClubPayload } from '@/types';

export async function createClub(payload: CreateClubPayload) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (isTeamAdmin(user)) return { error: 'No autorizado: los admins de equipo no pueden crear clubes' };

  const { data, error } = await supabase
    .from('clubs')
    .insert(payload)
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath('/admin/clubes');
  revalidatePath('/clubes');
  return { data };
}

export async function updateClub(id: string, payload: UpdateClubPayload) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // team_admin solo puede actualizar su propio club
  if (isTeamAdmin(user)) {
    const allowedClubId = getAdminClubId(user);
    if (allowedClubId !== id) return { error: 'No autorizado: solo puedes editar tu propio club' };
  }

  const { error } = await supabase.from('clubs').update(payload).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/clubes');
  revalidatePath('/clubes');
  return { success: true };
}
