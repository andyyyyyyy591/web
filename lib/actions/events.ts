'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import type { AddMatchEventPayload } from '@/types';
import { GOAL_TYPES } from '@/types';

export async function addMatchEvent(payload: AddMatchEventPayload) {
  const supabase = createAdminClient();

  const { data: event, error } = await supabase
    .from('match_events')
    .insert(payload)
    .select()
    .single();

  if (error) return { error: error.message };

  // Si es gol, actualizar el marcador
  if (GOAL_TYPES.includes(payload.type)) {
    const { data: match } = await supabase
      .from('matches')
      .select('home_club_id, away_club_id, home_score, away_score')
      .eq('id', payload.match_id)
      .single();

    if (match) {
      const isOwnGoal = payload.type === 'own_goal';
      // own_goal: el club que lo hizo en contra pierde el gol; el rival suma
      const scoringClub = isOwnGoal
        ? (match.home_club_id === payload.club_id ? match.away_club_id : match.home_club_id)
        : payload.club_id;

      const isHome = scoringClub === match.home_club_id;
      const update = isHome
        ? { home_score: (match.home_score ?? 0) + 1 }
        : { away_score: (match.away_score ?? 0) + 1 };

      await supabase.from('matches').update(update).eq('id', payload.match_id);
    }
  }

  revalidatePath(`/admin/partidos/${payload.match_id}/live`);
  revalidatePath(`/admin/partidos/${payload.match_id}`);
  return { data: event };
}

export async function deleteMatchEvent(eventId: string, matchId: string) {
  const supabase = createAdminClient();

  // Leer el evento antes de borrar para revertir el marcador si es gol
  const { data: event } = await supabase
    .from('match_events')
    .select('*')
    .eq('id', eventId)
    .single();

  const { error } = await supabase.from('match_events').delete().eq('id', eventId);
  if (error) return { error: error.message };

  if (event && GOAL_TYPES.includes(event.type)) {
    const { data: match } = await supabase
      .from('matches')
      .select('home_club_id, away_club_id, home_score, away_score')
      .eq('id', matchId)
      .single();

    if (match) {
      const isOwnGoal = event.type === 'own_goal';
      const scoringClub = isOwnGoal
        ? (match.home_club_id === event.club_id ? match.away_club_id : match.home_club_id)
        : event.club_id;
      const isHome = scoringClub === match.home_club_id;
      const update = isHome
        ? { home_score: Math.max(0, (match.home_score ?? 0) - 1) }
        : { away_score: Math.max(0, (match.away_score ?? 0) - 1) };
      await supabase.from('matches').update(update).eq('id', matchId);
    }
  }

  revalidatePath(`/admin/partidos/${matchId}/live`);
  revalidatePath(`/admin/partidos/${matchId}`);
  return { success: true };
}
