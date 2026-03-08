import { requireSuperAdmin } from '@/lib/utils/admin-guard';
import { getClubs } from '@/lib/queries/clubs';
import { createClient } from '@/lib/supabase/server';
import { TrofeosClient } from './TrofeosClient';

export default async function TrofeosPage() {
  await requireSuperAdmin();
  const supabase = await createClient();
  const clubs = await getClubs();
  const { data: trophies } = await supabase
    .from('trophies')
    .select('*, club:clubs(name)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Trofeos</h1>
      <TrofeosClient clubs={clubs} trophies={(trophies ?? []) as any} />
    </div>
  );
}
