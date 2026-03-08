import type { MatchDateWithMatches } from '@/types';
import { MatchCard } from '@/components/match/MatchCard';

interface FixtureListProps {
  matchDates: MatchDateWithMatches[];
}

export function FixtureList({ matchDates }: FixtureListProps) {
  if (matchDates.length === 0) {
    return <p className="py-12 text-center text-slate-400">No hay fechas programadas</p>;
  }

  return (
    <div className="space-y-8">
      {matchDates.map((date) => (
        <section key={date.id}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {date.label ?? `Fecha ${date.number}`}
          </h2>
          {date.matches.length === 0 ? (
            <p className="text-sm text-slate-400">Sin partidos asignados</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {date.matches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
