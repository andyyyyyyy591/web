import { notFound } from 'next/navigation';
import { getDivisionBySlug, getActiveTournamentByDivision } from '@/lib/queries/divisions';
import { getTopScorersByTournament } from '@/lib/queries/players';
import { DivisionNav } from '@/components/layout/DivisionNav';
import { TopScorers } from '@/components/division/TopScorers';

interface Props {
  params: Promise<{ division: string }>;
}

export default async function GoleadoresPage({ params }: Props) {
  const { division: slug } = await params;
  const division = await getDivisionBySlug(slug);
  if (!division) notFound();

  const tournament = await getActiveTournamentByDivision(division.id);
  const scorers = tournament ? await getTopScorersByTournament(tournament.id) : [];

  return (
    <>
      <DivisionNav divisionSlug={slug} />
      <div className="mt-6">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">
          {division.label} — Goleadores
        </h1>
        <TopScorers scorers={scorers} />
      </div>
    </>
  );
}
