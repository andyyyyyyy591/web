'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';

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

  const rows = entries.map((e) => ({
    match_id: matchId,
    club_id: clubId,
    player_id: e.player_id,
    is_starter: e.is_starter,
    shirt_number: e.shirt_number,
    position_label: e.position_label,
  }));

  const { error } = await supabase.from('match_lineups').insert(rows);
  if (error) return { error: error.message };

  revalidatePath(`/admin/partidos/${matchId}`);
  return { success: true };
}
