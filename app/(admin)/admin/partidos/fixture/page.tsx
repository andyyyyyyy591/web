import { getTournaments } from '@/lib/queries/tournaments';
import { getClubs } from '@/lib/queries/clubs';
import { FixtureForm } from './FixtureForm';
import { requireSuperAdmin } from '@/lib/utils/admin-guard';

export default async function CargaFixturePage() {
  await requireSuperAdmin();
  const [tournaments, clubs] = await Promise.all([
    getTournaments(),
    getClubs(),
  ]);
  return <FixtureForm tournaments={tournaments} clubs={clubs} />;
}
