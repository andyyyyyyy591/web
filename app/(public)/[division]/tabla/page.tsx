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

  const hasZones = standings.some((s) => s.zone);
  const zoneA = standings.filter((s) => s.zone === 'A');
  const zoneB = standings.filter((s) => s.zone === 'B');
  const noZone = standings.filter((s) => !s.zone);

  return (
    <>
      <DivisionNav divisionSlug={slug} />
      <div className="mt-6">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">
          {division.label} — Tabla de posiciones
        </h1>
        {standings.length === 0 ? (
          <p className="py-12 text-center text-slate-400">Sin posiciones registradas</p>
        ) : hasZones ? (
          <div className="space-y-6">
            {zoneA.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-purple-600">Zona A</h2>
                <StandingsTable standings={zoneA} />
              </div>
            )}
            {zoneB.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-purple-600">Zona B</h2>
                <StandingsTable standings={zoneB} />
              </div>
            )}
            {noZone.length > 0 && <StandingsTable standings={noZone} />}
          </div>
        ) : (
          <StandingsTable standings={standings} />
        )}
      </div>
    </>
  );
}
