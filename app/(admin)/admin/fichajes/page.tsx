import { requireSuperAdmin } from '@/lib/utils/admin-guard';
import { getClubs } from '@/lib/queries/clubs';
import { createClient } from '@/lib/supabase/server';
import { FichajesClient } from './FichajesClient';

export default async function FichajesPage() {
  await requireSuperAdmin();
  const supabase = await createClient();
  const clubs = await getClubs();

  const [{ data: players }, { data: transfers }, { data: seasons }] = await Promise.all([
    supabase.from('players').select('id, first_name, last_name, club_id').eq('is_active', true).order('last_name'),
    supabase.from('transfers').select('*, player:players(first_name, last_name), club:clubs(name), season:seasons(name)').order('created_at', { ascending: false }),
    supabase.from('seasons').select('id, name').order('year', { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Fichajes</h1>
      <FichajesClient
        clubs={clubs}
        players={(players ?? []) as any}
        transfers={(transfers ?? []) as any}
        seasons={(seasons ?? []) as any}
      />
    </div>
  );
}
