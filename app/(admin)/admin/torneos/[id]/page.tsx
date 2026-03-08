import { notFound } from 'next/navigation';
import { requireSuperAdmin } from '@/lib/utils/admin-guard';
import { createClient } from '@/lib/supabase/server';
import { getAllClubsForTournamentAdmin } from '@/lib/queries/tournament-clubs';
import { TournamentClubsForm } from './TournamentClubsForm';
import type { TournamentFormat } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TournamentClubsPage({ params }: Props) {
  await requireSuperAdmin();
  const { id } = await params;

  const supabase = await createClient();
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*, season:seasons(name, year), division:divisions(name, slug)')
    .eq('id', id)
    .single();

  if (!tournament) notFound();

  const { allClubs, registered } = await getAllClubsForTournamentAdmin(id);

  const format: TournamentFormat = (tournament as any).format ?? 'todos_contra_todos';

  const FORMAT_LABELS: Record<TournamentFormat, string> = {
    todos_contra_todos: 'Todos contra todos',
    zonas: 'Zona A / Zona B',
    eliminatorias: 'Cruces / Eliminatorias',
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {(tournament.division as any)?.name} — {(tournament.season as any)?.name}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Formato actual: <span className="font-medium text-slate-700">{FORMAT_LABELS[format]}</span>
        </p>
      </div>

      <TournamentClubsForm
        tournamentId={id}
        allClubs={allClubs}
        registered={registered}
        format={format}
      />
    </div>
  );
}
