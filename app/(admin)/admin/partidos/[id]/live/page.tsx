import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMatchById } from '@/lib/queries/matches';
import { getPlayersByClub, getAllPlayers } from '@/lib/queries/players';
import { getClubs } from '@/lib/queries/clubs';
import { getSuspendedPlayers } from '@/lib/queries/suspensions';
import { getCoachingStaffByClub, getMatchStaffIds } from '@/lib/queries/coaching-staff';
import { LiveMatchControl } from '@/components/admin/LiveMatchControl';
import { getAdminRole, getAdminClubId } from '@/lib/utils/auth';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LiveControlPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = getAdminRole(user);
  const userClubId = getAdminClubId(user);

  const match = await getMatchById(id);
  if (!match) notFound();

  const [allClubs, allSuspended, homeStaff, awayStaff, homeStaffIds, awayStaffIds] = await Promise.all([
    getClubs(),
    getSuspendedPlayers(match.tournament_id).catch(() => []),
    getCoachingStaffByClub(match.home_club_id),
    getCoachingStaffByClub(match.away_club_id),
    getMatchStaffIds(id, match.home_club_id),
    getMatchStaffIds(id, match.away_club_id),
  ]);

  const suspendedPlayerIds = allSuspended
    .filter((s) => !s.served)
    .map((s) => s.player_id);

  // Solo los clubes del partido
  const matchClubs = allClubs.filter(
    (c) => c.id === match.home_club_id || c.id === match.away_club_id,
  );

  // Team admin: solo carga jugadores de su club. Super admin: todos del partido.
  let matchPlayers;
  if (role === 'team_admin' && userClubId) {
    matchPlayers = await getPlayersByClub(userClubId);
  } else {
    const all = await getAllPlayers();
    matchPlayers = all.filter(
      (p) => p.club_id === match.home_club_id || p.club_id === match.away_club_id,
    );
  }

  const homeClub = matchClubs.find((c) => c.id === match.home_club_id);
  const awayClub = matchClubs.find((c) => c.id === match.away_club_id);

  return (
    <div className="space-y-4 pb-6">
      <div>
        <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
          {homeClub?.short_name ?? homeClub?.name} vs {awayClub?.short_name ?? awayClub?.name}
        </h1>
        <p className="text-sm text-slate-500">{match.tournament.division.label} · Control en vivo</p>
      </div>
      <LiveMatchControl
        initialMatch={match}
        clubs={matchClubs}
        players={matchPlayers}
        role={role}
        userClubId={userClubId}
        suspendedPlayerIds={suspendedPlayerIds}
        homeCoachingStaff={homeStaff}
        awayCoachingStaff={awayStaff}
        homeExistingStaffIds={homeStaffIds}
        awayExistingStaffIds={awayStaffIds}
      />
    </div>
  );
}
