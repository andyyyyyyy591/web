'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminContext } from '@/lib/utils/admin-guard';

interface InjuryPayload {
  player_id: string;
  club_id: string;
  description: string;
  estimated_recovery?: string | null;
  is_active?: boolean;
}

export async function createInjury(payload: InjuryPayload) {
  const ctx = await getAdminContext();
  if (ctx.isTeamAdmin && ctx.clubId !== payload.club_id) return { error: 'Sin permiso' };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('player_injuries')
    .insert({
      player_id: payload.player_id,
      club_id: payload.club_id,
      description: payload.description,
      estimated_recovery: payload.estimated_recovery ?? null,
      is_active: payload.is_active ?? true,
    })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath('/admin/lesiones');
  return { data };
}

export async function updateInjury(
  id: string,
  payload: { description?: string; estimated_recovery?: string | null; is_active?: boolean },
) {
  const ctx = await getAdminContext();
  const admin = createAdminClient();

  if (ctx.isTeamAdmin) {
    const { data: existing } = await admin
      .from('player_injuries')
      .select('club_id')
      .eq('id', id)
      .single();
    if (!existing || existing.club_id !== ctx.clubId) return { error: 'Sin permiso' };
  }

  const { data, error } = await admin
    .from('player_injuries')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath('/admin/lesiones');
  return { data };
}

export async function deleteInjury(id: string) {
  const ctx = await getAdminContext();
  const admin = createAdminClient();

  if (ctx.isTeamAdmin) {
    const { data: existing } = await admin
      .from('player_injuries')
      .select('club_id')
      .eq('id', id)
      .single();
    if (!existing || existing.club_id !== ctx.clubId) return { error: 'Sin permiso' };
  }

  const { error } = await admin.from('player_injuries').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/lesiones');
  return { success: true };
}
