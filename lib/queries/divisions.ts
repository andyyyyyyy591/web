import { createClient } from '@/lib/supabase/server';
import type { Division } from '@/types';

export async function getDivisions(): Promise<Division[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('divisions')
    .select('*')
    .order('display_order');
  if (error) throw new Error(error.message);
  return data;
}

export async function getDivisionBySlug(slug: string): Promise<Division | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('divisions')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) return null;
  return data;
}

export async function getActiveTournamentByDivision(divisionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tournaments')
    .select('*, season:seasons(*), division:divisions(*)')
    .eq('division_id', divisionId)
    .eq('is_active', true)
    .single();
  if (error) return null;
  return data;
}
