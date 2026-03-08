'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { CreateMatchPayload, UpdateMatchPayload, MatchStatus } from '@/types';

export async function createMatch(payload: CreateMatchPayload) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('matches')
    .insert(payload)
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath('/admin/partidos');
  return { data };
}

export async function updateMatch(id: string, payload: UpdateMatchPayload) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('matches')
    .update(payload)
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath(`/admin/partidos/${id}`);
  return { success: true };
}

export async function updateMatchStatus(
  id: string,
  status: MatchStatus,
  extra?: { first_half_added_time?: number; second_half_added_time?: number },
) {
  const supabase = await createClient();

  const timestampField: Partial<Record<string, string>> = {
    first_half:         'started_at',
    halftime:           'halftime_at',
    second_half:        'second_half_at',
    extra_time_first:   'extra_time_first_at',
    extra_time_break:   'extra_time_break_at',
    extra_time_second:  'extra_time_second_at',
    finished:           'finished_at',
  };

  const tsField = timestampField[status];
  const update: Record<string, unknown> = { status, ...extra };
  if (tsField) update[tsField] = new Date().toISOString();

  const { error } = await supabase.from('matches').update(update).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath(`/admin/partidos/${id}/live`);
  return { success: true };
}

export async function createMatchDate(tournamentId: string, number: number, label?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('match_dates')
    .insert({ tournament_id: tournamentId, number, label: label || `Fecha ${number}` })
    .select()
    .single();
  if (error) return { error: error.message };
  return { data };
}

export async function createMatchesBatch(matches: CreateMatchPayload[]) {
  if (matches.length === 0) return { error: 'No hay partidos para guardar' };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('matches')
    .insert(matches)
    .select();
  if (error) return { error: error.message };
  revalidatePath('/admin/partidos');
  return { data, count: data.length };
}

export async function deleteMatch(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('matches').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/partidos');
  return { success: true };
}
