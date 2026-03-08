'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';

export async function upsertSuspension(payload: {
  id?: string;
  player_id: string;
  tournament_id: string;
  reason: string;
  card_match_date?: number | null;
  suspended_for_date: number;
  suspended_until_date?: number | null;
  notes?: string | null;
}) {
  const admin = createAdminClient();

  const untilDate = payload.suspended_until_date && payload.suspended_until_date > payload.suspended_for_date
    ? payload.suspended_until_date
    : null;

  if (payload.id) {
    const { error } = await admin
      .from('player_suspensions')
      .update({
        reason: payload.reason,
        card_match_date: payload.card_match_date ?? null,
        suspended_for_date: payload.suspended_for_date,
        suspended_until_date: untilDate,
        notes: payload.notes ?? null,
      })
      .eq('id', payload.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await admin
      .from('player_suspensions')
      .insert({
        player_id: payload.player_id,
        tournament_id: payload.tournament_id,
        reason: payload.reason,
        card_match_date: payload.card_match_date ?? null,
        suspended_for_date: payload.suspended_for_date,
        suspended_until_date: untilDate,
        notes: payload.notes ?? null,
      });
    if (error) return { error: error.message };
  }

  revalidatePath('/admin/suspensiones');
  return { success: true };
}

export async function deleteSuspension(id: string) {
  const admin = createAdminClient();
  const { error } = await admin.from('player_suspensions').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/suspensiones');
  return { success: true };
}
