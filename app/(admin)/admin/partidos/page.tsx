import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getAllMatches, getMatchesByClub } from '@/lib/queries/matches';
import { getAdminRole, getAdminClubId } from '@/lib/utils/auth';
import { STATUS_LABELS, isLive } from '@/types';
import { formatDateTime } from '@/lib/utils/format';
import { Badge } from '@/components/ui/Badge';

export default async function AdminPartidosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = getAdminRole(user);
  const clubId = getAdminClubId(user);

  const isTeamAdmin = role === 'team_admin';
  const matches = isTeamAdmin && clubId
    ? await getMatchesByClub(clubId)
    : await getAllMatches();

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Partidos</h1>
        {!isTeamAdmin && (
          <div className="flex gap-2">
            <Link href="/admin/partidos/fixture"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Fixture
            </Link>
            <Link href="/admin/partidos/nuevo"
              className="rounded-xl bg-green-600 px-3 py-2 text-sm font-bold text-white hover:bg-green-700">
              + Nuevo
            </Link>
          </div>
        )}
      </div>

      {matches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400">
          Sin partidos registrados
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map((m) => {
            const live = isLive(m.status);
            const hasScore = m.status !== 'scheduled' && m.status !== 'postponed' && m.status !== 'cancelled';
            return (
              <div
                key={m.id}
                className={`rounded-2xl border bg-white p-4 transition-shadow hover:shadow-sm ${live ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}
              >
                {/* Division + date + status */}
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{m.tournament.division.label}</span>
                    {m.match_date && <span>· Fecha {m.match_date.number}</span>}
                    {m.scheduled_at && <span>· {formatDateTime(m.scheduled_at)}</span>}
                  </div>
                  <Badge variant={live ? 'red' : m.status === 'finished' ? 'gray' : 'default'}>
                    {live && <span className="live-dot mr-1" />}
                    {STATUS_LABELS[m.status]}
                  </Badge>
                </div>

                {/* Teams + score */}
                <div className="flex items-center justify-between gap-2">
                  <span className="flex-1 text-right text-sm font-semibold text-slate-800">
                    {m.home_club.short_name ?? m.home_club.name}
                  </span>
                  <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 tabular-nums">
                    {hasScore ? (
                      <>
                        <span className="text-lg font-black">{m.home_score}</span>
                        <span className="text-slate-400">—</span>
                        <span className="text-lg font-black">{m.away_score}</span>
                      </>
                    ) : (
                      <span className="text-sm font-medium text-slate-500">vs</span>
                    )}
                  </div>
                  <span className="flex-1 text-sm font-semibold text-slate-800">
                    {m.away_club.short_name ?? m.away_club.name}
                  </span>
                </div>

                {/* Acciones */}
                <div className="mt-3 flex gap-2">
                  {!isTeamAdmin && (
                    <Link href={`/admin/partidos/${m.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                      Editar
                    </Link>
                  )}
                  {m.tournament.division.has_live_mode && (live || m.status === 'scheduled') && (
                    <Link
                      href={`/admin/partidos/${m.id}/live`}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                        live
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'border border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {live ? '🔴 Control en vivo' : '▶ Iniciar partido'}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
