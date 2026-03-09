'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';

export async function createCoachingStaff(data: {
  club_id: string;
  first_name: string;
  last_name: string;
  role: string;
  photo_url?: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('coaching_staff').insert(data);
  if (error) return { error: error.message };
  revalidatePath('/admin/cuerpo-tecnico');
  return { success: true };
}

export async function updateCoachingStaff(id: string, data: {
  first_name?: string;
  last_name?: string;
  role?: string;
  photo_url?: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('coaching_staff').update(data).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/cuerpo-tecnico');
  return { success: true };
}

export async function deactivateCoachingStaff(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('coaching_staff').update({ is_active: false }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/cuerpo-tecnico');
  return { success: true };
}

export async function saveMatchCoachingStaff(matchId: string, clubId: string, staffIds: string[]) {
  const supabase = createAdminClient();
  await supabase.from('match_coaching_staff').delete()
    .eq('match_id', matchId).eq('club_id', clubId);
  if (staffIds.length === 0) {
    revalidatePath(`/admin/partidos/${matchId}`);
    return { success: true };
  }
  const rows = staffIds.map((staff_id) => ({ match_id: matchId, club_id: clubId, staff_id }));
  const { error } = await supabase.from('match_coaching_staff').insert(rows);
  if (error) return { error: error.message };
  revalidatePath(`/admin/partidos/${matchId}`);
  return { success: true };
}
