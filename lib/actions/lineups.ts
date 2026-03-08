'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCoordsForPosition } from '@/lib/utils/position-coords';

export interface LineupEntry {
  player_id: string;
  is_starter: boolean;
  shirt_number: number | null;
  position_label: string | null;
}

export async function saveLineup(matchId: string, clubId: string, entries: LineupEntry[]) {
  const supabase = createAdminClient();

  // Delete existing lineup for this club+match
  const { error: delErr } = await supabase
    .from('match_lineups')
    .delete()
    .eq('match_id', matchId)
    .eq('club_id', clubId);
  if (delErr) return { error: delErr.message };

  if (entries.length === 0) {
    revalidatePath(`/admin/partidos/${matchId}`);
    return { success: true };
  }

  // Calcular coordenadas agrupando por posición para evitar solapamiento
  const posGroups: Record<string, number[]> = {};
  entries.forEach((e, i) => {
    const key = e.position_label ?? '__none__';
    if (!posGroups[key]) posGroups[key] = [];
    posGroups[key].push(i);
  });

  const rows = entries.map((e, i) => {
    const key = e.position_label ?? '__none__';
    const group = posGroups[key];
    const indexInGroup = group.indexOf(i);
    const coords = getCoordsForPosition(e.position_label, indexInGroup, group.length);
    return {
      match_id: matchId,
      club_id: clubId,
      player_id: e.player_id,
      is_starter: e.is_starter,
      shirt_number: e.shirt_number,
      position_label: e.position_label,
      field_x: e.position_label ? coords.x : null,
      field_y: e.position_label ? coords.y : null,
    };
  });

  const { error } = await supabase.from('match_lineups').insert(rows);
  if (error) return { error: error.message };

  revalidatePath(`/admin/partidos/${matchId}`);
  return { success: true };
}
