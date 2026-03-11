'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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
  const admin = createAdminClient();
  const { error } = await admin
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

  // Use admin client so team_admin role can also update match status
  const admin = createAdminClient();
  const { error } = await admin.from('matches').update(update).eq('id', id);
  if (error) return { error: error.message };

  // Auto-recalculate standings when match finishes
  if (status === 'finished') {
    const { data: matchData } = await supabase
      .from('matches').select('tournament_id').eq('id', id).single();
    if (matchData?.tournament_id) {
      // SECURITY DEFINER function — works with regular client too, but admin bypasses RLS
      const { error: rpcErr } = await admin.rpc('recalculate_tournament_standings', {
        p_tournament_id: matchData.tournament_id,
      });
      if (rpcErr) console.error('standings rpc error:', rpcErr.message);
    }
  }

  revalidatePath(`/admin/partidos/${id}/live`);
  revalidatePath('/admin/partidos');
  revalidatePath('/');
  return { success: true };
}

/** Cierra la tanda de penales, marca el partido como terminado y guarda el ganador. */
export async function finalizePenalties(matchId: string, winnerClubId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { error } = await admin.from('matches').update({
    status: 'finished',
    finished_at: new Date().toISOString(),
    penalty_winner_club_id: winnerClubId,
  }).eq('id', matchId);
  if (error) return { error: error.message };

  const { data: matchData } = await supabase
    .from('matches').select('tournament_id').eq('id', matchId).single();
  if (matchData?.tournament_id) {
    const { error: rpcErr } = await admin.rpc('recalculate_tournament_standings', {
      p_tournament_id: matchData.tournament_id,
    });
    if (rpcErr) console.error('standings rpc error:', rpcErr.message);
  }

  revalidatePath(`/admin/partidos/${matchId}/live`);
  revalidatePath('/admin/partidos');
  revalidatePath('/');
  return { success: true };
}

export async function createMatchDate(tournamentId: string, number: number, label?: string) {
  const supabase = await createClient();

  // Check if it already exists — if so, return it
  const { data: existing } = await supabase
    .from('match_dates')
    .select()
    .eq('tournament_id', tournamentId)
    .eq('number', number)
    .single();
  if (existing) return { data: existing };

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

  // Auto-registrar clubes en tournament_clubs según la zona del partido
  // (zona_a → zone='A', zona_b → zone='B'; interzonales no tocan zonas ya asignadas)
  const clubZones = new Map<string, { tournament_id: string; club_id: string; zone: string }>();
  for (const m of matches) {
    const zone = m.match_zone === 'zona_a' ? 'A' : m.match_zone === 'zona_b' ? 'B' : null;
    if (zone && m.tournament_id && m.home_club_id && m.away_club_id) {
      for (const clubId of [m.home_club_id, m.away_club_id]) {
        clubZones.set(`${m.tournament_id}-${clubId}`, { tournament_id: m.tournament_id, club_id: clubId, zone });
      }
    }
  }
  if (clubZones.size > 0) {
    const admin = createAdminClient();
    await admin.from('tournament_clubs').upsert(
      Array.from(clubZones.values()),
      { onConflict: 'tournament_id,club_id' },
    );
  }

  revalidatePath('/admin/partidos');
  return { data, count: data.length };
}

/** Marca un partido como finalizado con el resultado indicado y recalcula standings. */
export async function finalizeMatch(id: string, homeScore: number, awayScore: number) {
  const admin = createAdminClient();
  const { error } = await admin.from('matches').update({
    status: 'finished',
    finished_at: new Date().toISOString(),
    home_score: homeScore,
    away_score: awayScore,
  }).eq('id', id);
  if (error) return { error: error.message };

  const supabase = await createClient();
  const { data: matchData } = await supabase
    .from('matches').select('tournament_id').eq('id', id).single();
  if (matchData?.tournament_id) {
    const { error: rpcErr } = await admin.rpc('recalculate_tournament_standings', {
      p_tournament_id: matchData.tournament_id,
    });
    if (rpcErr) console.error('standings rpc error:', rpcErr.message);
  }

  revalidatePath(`/admin/partidos/${id}`);
  revalidatePath('/admin/partidos');
  revalidatePath('/');
  return { success: true };
}

/** Vuelve un partido al estado programado (deshace la finalización). */
export async function reopenMatch(id: string) {
  const admin = createAdminClient();
  const { error } = await admin.from('matches').update({
    status: 'scheduled',
    started_at: null,
    finished_at: null,
    home_score: null,
    away_score: null,
  }).eq('id', id);
  if (error) return { error: error.message };

  const supabase = await createClient();
  const { data: matchData } = await supabase
    .from('matches').select('tournament_id').eq('id', id).single();
  if (matchData?.tournament_id) {
    const { error: rpcErr } = await admin.rpc('recalculate_tournament_standings', {
      p_tournament_id: matchData.tournament_id,
    });
    if (rpcErr) console.error('standings rpc error:', rpcErr.message);
  }

  revalidatePath(`/admin/partidos/${id}`);
  revalidatePath('/admin/partidos');
  revalidatePath('/');
  return { success: true };
}

export async function deleteMatch(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('matches').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/partidos');
  return { success: true };
}
