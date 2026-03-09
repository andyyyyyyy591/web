'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { TournamentFormat } from '@/types';

export async function updateTournamentFormat(tournamentId: string, format: TournamentFormat) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('tournaments')
    .update({ format })
    .eq('id', tournamentId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/torneos/${tournamentId}`);
  return { success: true };
}

/**
 * Sincroniza tournament_clubs desde los partidos existentes (match_zone)
 * y luego recalcula la tabla de posiciones.
 * Útil cuando los partidos fueron cargados antes de que se auto-populara tournament_clubs.
 */
export async function syncAndRecalculateStandings(tournamentId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();

  // 1. Obtener todos los partidos del torneo con match_zone
  const { data: matches, error: mErr } = await supabase
    .from('matches')
    .select('home_club_id, away_club_id, match_zone')
    .eq('tournament_id', tournamentId);
  if (mErr) return { error: mErr.message };

  // 2. Determinar la zona de cada club según sus partidos de zona
  const clubZones = new Map<string, string>();
  for (const m of matches ?? []) {
    if (m.match_zone === 'zona_a') {
      clubZones.set(m.home_club_id, 'A');
      clubZones.set(m.away_club_id, 'A');
    } else if (m.match_zone === 'zona_b') {
      clubZones.set(m.home_club_id, 'B');
      clubZones.set(m.away_club_id, 'B');
    } else {
      // todos_contra_todos o sin zona: registrar sin zona si no existe
      for (const id of [m.home_club_id, m.away_club_id]) {
        if (!clubZones.has(id)) clubZones.set(id, '');
      }
    }
  }

  // 3. Upsert en tournament_clubs
  const entries = Array.from(clubZones.entries())
    .filter(([club_id]) => club_id)
    .map(([club_id, zone]) => ({
      tournament_id: tournamentId,
      club_id,
      zone: zone || null,
    }));

  if (entries.length > 0) {
    const { error: uErr } = await admin
      .from('tournament_clubs')
      .upsert(entries, { onConflict: 'tournament_id,club_id' });
    if (uErr) return { error: uErr.message };
  }

  // 4. Recalcular standings
  const { error: rpcErr } = await admin.rpc('recalculate_tournament_standings', {
    p_tournament_id: tournamentId,
  });
  if (rpcErr) return { error: rpcErr.message };

  revalidatePath(`/admin/torneos/${tournamentId}`);
  revalidatePath('/');
  return { success: true, clubsRegistered: entries.length };
}

export interface TournamentClubForFixture {
  club_id: string;
  club_name: string;
  zone: string | null;
}

export async function getTournamentClubsForFixture(
  tournamentId: string,
): Promise<TournamentClubForFixture[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tournament_clubs')
    .select('club_id, zone, club:clubs(name)')
    .eq('tournament_id', tournamentId)
    .order('zone', { ascending: true, nullsFirst: true });
  if (error || !data) return [];
  return data.map((r: any) => ({
    club_id: r.club_id,
    club_name: r.club?.name ?? '',
    zone: r.zone ?? null,
  }));
}
