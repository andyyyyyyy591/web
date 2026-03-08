import { getClubs } from '@/lib/queries/clubs';
import { NuevoJugadorForm } from './NuevoJugadorForm';
import { getAdminContext } from '@/lib/utils/admin-guard';

export default async function NuevoJugadorPage() {
  const { isSuperAdmin, clubId } = await getAdminContext();
  const clubs = await getClubs();
  return <NuevoJugadorForm clubs={clubs} lockedClubId={isSuperAdmin ? undefined : (clubId ?? undefined)} />;
}
