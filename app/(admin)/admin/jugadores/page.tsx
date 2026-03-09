import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getAllPlayers, getPlayersByClub } from '@/lib/queries/players';
import { getClubs } from '@/lib/queries/clubs';
import { getAdminRole, getAdminClubId } from '@/lib/utils/auth';
import { JugadoresClient } from './JugadoresClient';

export default async function AdminJugadoresPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = getAdminRole(user);
  const clubId = getAdminClubId(user);

  const isTeamAdmin = role === 'team_admin';

  const [players, clubs] = await Promise.all([
    isTeamAdmin && clubId ? getPlayersByClub(clubId) : getAllPlayers(),
    isTeamAdmin ? Promise.resolve([]) : getClubs(),
  ]);

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          {isTeamAdmin ? 'Mi equipo' : 'Jugadores'}
        </h1>
        <Link href="/admin/jugadores/nuevo"
          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700">
          + Nuevo jugador
        </Link>
      </div>

      <JugadoresClient
        players={players as any}
        clubs={clubs.map((c) => ({ id: c.id, name: c.name }))}
        isTeamAdmin={isTeamAdmin}
      />
    </div>
  );
}
