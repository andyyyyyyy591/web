import { getTournaments } from '@/lib/queries/tournaments';
import { getClubs } from '@/lib/queries/clubs';
import { NuevoPartidoForm } from './NuevoPartidoForm';
import { requireSuperAdmin } from '@/lib/utils/admin-guard';

export default async function NuevoPartidoPage() {
  await requireSuperAdmin();
  const [tournaments, clubs] = await Promise.all([
    getTournaments(),
    getClubs(),
  ]);
  return <NuevoPartidoForm tournaments={tournaments} clubs={clubs} />;
}
