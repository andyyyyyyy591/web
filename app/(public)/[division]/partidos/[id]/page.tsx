import { notFound } from 'next/navigation';
import { getMatchById } from '@/lib/queries/matches';
import { getStandingsByTournament } from '@/lib/queries/standings';
import { getSuspendedPlayers } from '@/lib/queries/suspensions';
import { MatchTabs } from './MatchTabs';
import { RealtimeMatchWrapper } from './RealtimeMatchWrapper';

interface Props {
  params: Promise<{ division: string; id: string }>;
}

export default async function MatchPage({ params }: Props) {
  const { id } = await params;
  const match = await getMatchById(id);
  if (!match) notFound();

  const [standings, allSuspended] = await Promise.all([
    getStandingsByTournament(match.tournament_id).catch(() => []),
    getSuspendedPlayers(match.tournament_id).catch(() => []),
  ]);

  const homeIdx = standings.findIndex((s) => s.club_id === match.home_club_id);
  const awayIdx = standings.findIndex((s) => s.club_id === match.away_club_id);
  const homePosition = homeIdx >= 0 ? homeIdx + 1 : undefined;
  const awayPosition = awayIdx >= 0 ? awayIdx + 1 : undefined;

  const activeSuspended = allSuspended.filter((s) => !s.served);
  const homeSuspended = activeSuspended
    .filter((s) => s.club_id === match.home_club_id)
    .map(({ player_id, first_name, last_name }) => ({ player_id, first_name, last_name }));
  const awaySuspended = activeSuspended
    .filter((s) => s.club_id === match.away_club_id)
    .map(({ player_id, first_name, last_name }) => ({ player_id, first_name, last_name }));

  const hasLiveMode = match.tournament.division.has_live_mode;

  if (hasLiveMode) {
    return (
      <RealtimeMatchWrapper
        initialMatch={match}
        homePosition={homePosition}
        awayPosition={awayPosition}
        homeSuspended={homeSuspended}
        awaySuspended={awaySuspended}
      />
    );
  }

  return (
    <MatchTabs
      match={match}
      homePosition={homePosition}
      awayPosition={awayPosition}
      homeSuspended={homeSuspended}
      awaySuspended={awaySuspended}
    />
  );
}
