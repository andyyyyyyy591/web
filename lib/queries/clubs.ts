import { createClient } from '@/lib/supabase/server';
import type { Club, Trophy, TransferWithPlayer, News } from '@/types';

export async function getClubs(): Promise<Club[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) throw new Error(error.message);
  return data;
}

export async function getClubBySlug(slug: string): Promise<Club | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) return null;
  return data;
}

export async function getClubById(id: string): Promise<Club | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function getClubTrophies(clubId: string): Promise<Trophy[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('trophies')
    .select('*')
    .eq('club_id', clubId)
    .order('year', { ascending: false });
  if (error) return [];
  return data;
}

export async function getClubTransfers(clubId: string): Promise<TransferWithPlayer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transfers')
    .select('*, player:players(*), season:seasons(*)')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data as TransferWithPlayer[];
}

export async function getNewsByClub(clubName: string, limit = 10): Promise<News[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .ilike('title', `%${clubName}%`)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return data;
}
