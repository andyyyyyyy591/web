'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminContext } from '@/lib/utils/admin-guard';
import { redirect } from 'next/navigation';
import type { CreateTransferPayload } from '@/types';

export async function createTransfer(payload: CreateTransferPayload) {
  const ctx = await getAdminContext();
  // team admin can only create transfers for their own club
  if (ctx.isTeamAdmin && ctx.clubId !== payload.club_id) redirect('/admin');
  const supabase = await createClient();
  const { data, error } = await supabase.from('transfers').insert(payload).select().single();
  if (error) return { error: error.message };
  return { data };
}

export async function deleteTransfer(id: string) {
  const ctx = await getAdminContext();
  const supabase = await createClient();
  if (ctx.isTeamAdmin) {
    // verify it belongs to their club
    const { data } = await supabase.from('transfers').select('club_id').eq('id', id).single();
    if (!data || data.club_id !== ctx.clubId) redirect('/admin');
  }
  const { error } = await supabase.from('transfers').delete().eq('id', id);
  if (error) return { error: error.message };
  return { success: true };
}
