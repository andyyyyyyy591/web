import { notFound } from 'next/navigation';
import { getDivisionBySlug, getActiveTournamentByDivision } from '@/lib/queries/divisions';
import { getStandingsByTournament } from '@/lib/queries/standings';
import { getTopScorersByTournament } from '@/lib/queries/players';
import { getMatchesByTournament } from '@/lib/queries/matches';
import { getCardsByTournament } from '@/lib/queries/cards';
import { getClubsByTournament } from '@/lib/queries/tournament-clubs';
import { DivisionTabs } from './DivisionTabs';

interface Props {
  params: Promise<{ division: string }>;
}

export default async function DivisionPage({ params }: Props) {
  const { division: slug } = await params;
  const division = await getDivisionBySlug(slug);
  if (!division) notFound();

  const tournament = await getActiveTournamentByDivision(division.id);

  if (!tournament) {
    return (
      <div className="px-4 pt-4">
        <h1 className="text-xl font-bold text-primary mb-4">{division.label}</h1>
        <p className="py-12 text-center text-sm text-secondary">No hay torneo activo en esta división</p>
      </div>
    );
  }

  const [standings, scorers, matchDates, cards, tournamentClubs] = await Promise.all([
    getStandingsByTournament(tournament.id),
    getTopScorersByTournament(tournament.id),
    getMatchesByTournament(tournament.id),
    getCardsByTournament(tournament.id),
    getClubsByTournament(tournament.id),
  ]);

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-primary">{division.label}</h1>
        <p className="text-xs text-secondary mt-0.5">{tournament.name}</p>
      </div>

      <DivisionTabs
        divisionSlug={slug}
        standings={standings}
        scorers={scorers}
        matchDates={matchDates}
        cards={cards}
        tournamentClubs={tournamentClubs}
      />
    </div>
  );
}
