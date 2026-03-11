import { redirect } from 'next/navigation';
import { getAdminContext } from '@/lib/utils/admin-guard';
import { getPlayersByClub } from '@/lib/queries/players';
import { getClubs } from '@/lib/queries/clubs';
import { getAllInjuriesByClub } from '@/lib/queries/injuries';
import { LesionesClient } from './LesionesClient';

interface Props {
  searchParams: Promise<{ club?: string }>;
}

export default async function LesionesPage({ searchParams }: Props) {
  const ctx = await getAdminContext();
  const { club: clubParam } = await searchParams;

  if (ctx.isTeamAdmin && !ctx.clubId) redirect('/admin');

  // Team admin siempre usa su propio club; super admin usa el param o nada
  const targetClubId = ctx.isTeamAdmin ? ctx.clubId! : (clubParam ?? null);

  const clubs = ctx.isSuperAdmin ? await getClubs() : [];

  const [players, injuries] = targetClubId
    ? await Promise.all([
        getPlayersByClub(targetClubId),
        getAllInjuriesByClub(targetClubId),
      ])
    : [[], []];

  return (
    <LesionesClient
      clubs={clubs}
      players={players}
      injuries={injuries}
      targetClubId={targetClubId}
      isSuperAdmin={ctx.isSuperAdmin}
    />
  );
}
