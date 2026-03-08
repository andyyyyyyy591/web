import { notFound } from 'next/navigation';
import { getDivisionBySlug, getActiveTournamentByDivision } from '@/lib/queries/divisions';
import { getMatchesByTournament } from '@/lib/queries/matches';
import { DivisionNav } from '@/components/layout/DivisionNav';
import { FixtureList } from '@/components/division/FixtureList';

interface Props {
  params: Promise<{ division: string }>;
}

export default async function FixturePage({ params }: Props) {
  const { division: slug } = await params;
  const division = await getDivisionBySlug(slug);
  if (!division) notFound();

  const tournament = await getActiveTournamentByDivision(division.id);
  const matchDates = tournament ? await getMatchesByTournament(tournament.id) : [];

  return (
    <>
      <DivisionNav divisionSlug={slug} />
      <div className="mt-6">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">
          {division.label} — Fixture
        </h1>
        <FixtureList matchDates={matchDates} />
      </div>
    </>
  );
}
