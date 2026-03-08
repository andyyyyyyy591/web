'use server';

import { createClient } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/lib/utils/admin-guard';
import type { CreateTrophyPayload } from '@/types';

export async function createTrophy(payload: CreateTrophyPayload) {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from('trophies').insert(payload).select().single();
  if (error) return { error: error.message };
  return { data };
}

export async function deleteTrophy(id: string) {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('trophies').delete().eq('id', id);
  if (error) return { error: error.message };
  return { success: true };
}
