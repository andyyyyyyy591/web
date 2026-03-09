import { getClubs } from '@/lib/queries/clubs';
import { getDivisions } from '@/lib/queries/divisions';
import { NuevoJugadorForm } from './NuevoJugadorForm';
import { getAdminContext } from '@/lib/utils/admin-guard';

export default async function NuevoJugadorPage() {
  const { isSuperAdmin, clubId } = await getAdminContext();
  const [clubs, divisions] = await Promise.all([getClubs(), getDivisions()]);
  return (
    <NuevoJugadorForm
      clubs={clubs}
      divisions={divisions}
      lockedClubId={isSuperAdmin ? undefined : (clubId ?? undefined)}
    />
  );
}
