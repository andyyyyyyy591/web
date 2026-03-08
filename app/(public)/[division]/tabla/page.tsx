import { notFound } from 'next/navigation';
import { getDivisionBySlug, getActiveTournamentByDivision } from '@/lib/queries/divisions';
import { getStandingsByTournament } from '@/lib/queries/standings';
import { DivisionNav } from '@/components/layout/DivisionNav';
import { StandingsTable } from '@/components/division/StandingsTable';

interface Props {
  params: Promise<{ division: string }>;
}

export default async function TablaPage({ params }: Props) {
  const { division: slug } = await params;
  const division = await getDivisionBySlug(slug);
  if (!division) notFound();

  const tournament = await getActiveTournamentByDivision(division.id);
  const standings = tournament ? await getStandingsByTournament(tournament.id) : [];

  return (
    <>
      <DivisionNav divisionSlug={slug} />
      <div className="mt-6">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">
          {division.label} — Tabla de posiciones
        </h1>
        {standings.length === 0 ? (
          <p className="py-12 text-center text-slate-400">Sin posiciones registradas</p>
        ) : (
          <StandingsTable standings={standings} />
        )}
      </div>
    </>
  );
}
