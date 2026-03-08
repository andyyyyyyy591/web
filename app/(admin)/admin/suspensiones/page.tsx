import { getTournaments } from '@/lib/queries/tournaments';
import { getSuspendedPlayers } from '@/lib/queries/suspensions';
import { getAllPlayers } from '@/lib/queries/players';
import { requireSuperAdmin } from '@/lib/utils/admin-guard';
import { SuspensionesAdmin } from './SuspensionesAdmin';

export const revalidate = 0;

export default async function SuspensionesPage() {
  await requireSuperAdmin();
  const [tournaments, allPlayers] = await Promise.all([
    getTournaments(),
    getAllPlayers(),
  ]);

  if (tournaments.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400">
        No hay torneos activos
      </div>
    );
  }

  const initialData = await Promise.all(
    tournaments.map(async (t) => ({
      tournament: t as { id: string; name: string; division: { label: string } },
      suspensions: await getSuspendedPlayers(t.id),
    })),
  );

  const players = allPlayers.map((p) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    club_id: p.club_id,
    club_name: (p as any).club?.name ?? '',
  }));

  const tournamentsList = tournaments.map((t) => ({
    id: t.id,
    name: t.name,
    division: { label: (t as any).division?.label ?? t.name },
  }));

  return (
    <SuspensionesAdmin
      tournaments={tournamentsList}
      initialData={initialData}
      players={players}
    />
  );
}
