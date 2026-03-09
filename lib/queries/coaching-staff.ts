import { createClient } from '@/lib/supabase/server';
import type { CoachingStaff } from '@/types';

export async function getCoachingStaffByClub(clubId: string): Promise<CoachingStaff[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('coaching_staff')
    .select('*')
    .eq('club_id', clubId)
    .eq('is_active', true)
    .order('last_name');
  if (error) return [];
  return data;
}

export async function getAllCoachingStaff(): Promise<(CoachingStaff & { club: { name: string } })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('coaching_staff')
    .select('*, club:clubs(name)')
    .eq('is_active', true)
    .order('club_id')
    .order('last_name');
  if (error) return [];
  return data as (CoachingStaff & { club: { name: string } })[];
}

export interface MatchStaffEntry {
  club_id: string;
  staff: CoachingStaff;
}

export async function getMatchCoachingStaff(matchId: string): Promise<MatchStaffEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('match_coaching_staff')
    .select('club_id, staff:coaching_staff(*)')
    .eq('match_id', matchId);
  if (error) return [];
  return data as unknown as MatchStaffEntry[];
}

export async function getMatchStaffIds(matchId: string, clubId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('match_coaching_staff')
    .select('staff_id')
    .eq('match_id', matchId)
    .eq('club_id', clubId);
  return (data ?? []).map((r) => r.staff_id);
}
