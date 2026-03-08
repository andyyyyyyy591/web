'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { CreateSeasonPayload } from '@/types';

export async function createSeason(payload: CreateSeasonPayload) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('seasons')
    .insert(payload)
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath('/admin/temporadas');
  return { data };
}

export async function createTournamentsForSeason(seasonId: string) {
  const supabase = await createClient();

  const { data: divisions, error: divErr } = await supabase
    .from('divisions')
    .select('id, name');
  if (divErr) return { error: divErr.message };

  const tournaments = divisions.map((d) => ({
    season_id: seasonId,
    division_id: d.id,
    name: `Torneo ${d.name}`,
    is_active: true,
  }));

  const { error } = await supabase.from('tournaments').insert(tournaments);
  if (error) return { error: error.message };

  revalidatePath('/admin/temporadas');
  return { success: true };
}
