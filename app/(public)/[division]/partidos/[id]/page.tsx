import { notFound } from 'next/navigation';
import { getMatchById } from '@/lib/queries/matches';
import { getStandingsByTournament } from '@/lib/queries/standings';
import { getSuspendedPlayers } from '@/lib/queries/suspensions';
import { getMatchCoachingStaff } from '@/lib/queries/coaching-staff';
import { getActiveInjuriesByClubs } from '@/lib/queries/injuries';
import { MatchTabs } from './MatchTabs';
import { RealtimeMatchWrapper } from './RealtimeMatchWrapper';

interface Props {
  params: Promise<{ division: string; id: string }>;
}

export default async function MatchPage({ params }: Props) {
  const { id } = await params;
  const match = await getMatchById(id);
  if (!match) notFound();

  const [standings, allSuspended, matchStaff, allInjuries] = await Promise.all([
    getStandingsByTournament(match.tournament_id).catch(() => []),
    getSuspendedPlayers(match.tournament_id).catch(() => []),
    getMatchCoachingStaff(id).catch(() => []),
    getActiveInjuriesByClubs([match.home_club_id, match.away_club_id]).catch(() => []),
  ]);

  const homeStanding = standings.find((s) => s.club_id === match.home_club_id);
  const awayStanding = standings.find((s) => s.club_id === match.away_club_id);
  const homeZone = homeStanding?.zone ?? null;
  const awayZone = awayStanding?.zone ?? null;

  const homeZoneStandings = homeZone ? standings.filter((s) => s.zone === homeZone) : standings;
  const awayZoneStandings = awayZone ? standings.filter((s) => s.zone === awayZone) : standings;

  const homeIdx = homeZoneStandings.findIndex((s) => s.club_id === match.home_club_id);
  const awayIdx = awayZoneStandings.findIndex((s) => s.club_id === match.away_club_id);
  const homePosition = homeIdx >= 0 ? homeIdx + 1 : undefined;
  const awayPosition = awayIdx >= 0 ? awayIdx + 1 : undefined;

  const activeSuspended = allSuspended.filter((s) => !s.served);
  const homeSuspended = activeSuspended
    .filter((s) => s.club_id === match.home_club_id)
    .map(({ player_id, first_name, last_name, photo_url, reason }) => ({ player_id, first_name, last_name, photo_url, reason }));
  const awaySuspended = activeSuspended
    .filter((s) => s.club_id === match.away_club_id)
    .map(({ player_id, first_name, last_name, photo_url, reason }) => ({ player_id, first_name, last_name, photo_url, reason }));

  const homeInjured = allInjuries
    .filter((i) => i.club_id === match.home_club_id)
    .map(({ player_id, player, description, estimated_recovery }) => ({
      player_id, description, estimated_recovery,
      first_name: player.first_name, last_name: player.last_name, photo_url: player.photo_url,
    }));
  const awayInjured = allInjuries
    .filter((i) => i.club_id === match.away_club_id)
    .map(({ player_id, player, description, estimated_recovery }) => ({
      player_id, description, estimated_recovery,
      first_name: player.first_name, last_name: player.last_name, photo_url: player.photo_url,
    }));

  const hasLiveMode = match.tournament.division.has_live_mode;

  if (hasLiveMode) {
    return (
      <RealtimeMatchWrapper
        initialMatch={match}
        homePosition={homePosition}
        awayPosition={awayPosition}
        homeZone={homeZone}
        awayZone={awayZone}
        homeSuspended={homeSuspended}
        awaySuspended={awaySuspended}
        homeInjured={homeInjured}
        awayInjured={awayInjured}
        matchStaff={matchStaff}
      />
    );
  }

  return (
    <MatchTabs
      match={match}
      homePosition={homePosition}
      awayPosition={awayPosition}
      homeZone={homeZone}
      awayZone={awayZone}
      homeSuspended={homeSuspended}
      awaySuspended={awaySuspended}
      homeInjured={homeInjured}
      awayInjured={awayInjured}
      matchStaff={matchStaff}
    />
  );
}
