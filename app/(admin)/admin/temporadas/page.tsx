import { requireSuperAdmin } from '@/lib/utils/admin-guard';
import { getSeasonsWithTournaments } from '@/lib/queries/tournaments';
import { TemporadasForm } from './TemporadasForm';

export default async function TemporadasPage() {
  await requireSuperAdmin();
  const seasons = await getSeasonsWithTournaments();
  return <TemporadasForm initialSeasons={seasons} />;
}
