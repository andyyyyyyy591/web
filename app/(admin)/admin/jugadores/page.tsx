import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { getAllPlayers, getPlayersByClub } from '@/lib/queries/players';
import { getAdminRole, getAdminClubId } from '@/lib/utils/auth';
import { POSITION_LABELS } from '@/types';

export default async function AdminJugadoresPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = getAdminRole(user);
  const clubId = getAdminClubId(user);

  const isTeamAdmin = role === 'team_admin';
  const players = isTeamAdmin && clubId
    ? await getPlayersByClub(clubId)
    : await getAllPlayers();

  // For team admin, players are Player[] (no club relation), for super admin PlayerWithClub[]
  // We need to handle both cases

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

      {players.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400">
          Sin jugadores registrados
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((p) => (
            <Link
              key={p.id}
              href={`/admin/jugadores/${p.id}`}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 transition hover:shadow-md hover:border-green-200"
            >
              {p.photo_url ? (
                <Image src={p.photo_url} alt={p.first_name} width={44} height={44}
                  className="h-11 w-11 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-500">
                  {p.first_name[0]}{p.last_name[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-800">
                  {p.first_name} {p.last_name}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  {!isTeamAdmin && 'club' in p && (
                    <span>{(p as any).club?.name}</span>
                  )}
                  {p.position && (
                    <span>{POSITION_LABELS[p.position]}</span>
                  )}
                </div>
              </div>
              <span className="text-xs text-slate-400">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
