import Link from 'next/link';
import Image from 'next/image';
import type { MatchWithClubs } from '@/types';
import { STATUS_LABELS, isLive } from '@/types';
import { formatDateTime, formatTime } from '@/lib/utils/format';
import { Badge } from '@/components/ui/Badge';

interface Props {
  match: MatchWithClubs;
  /** Club ID of the current user (team admin), to hide live link for away matches */
  userClubId?: string | null;
}

export function AdminMatchCard({ match, userClubId }: Props) {
  const live = isLive(match.status);
  const finished = match.status === 'finished';
  const hasLive = match.tournament.division.has_live_mode;
  // Team admins only see the live link when they're the home club
  const canAccessLive = !userClubId || match.home_club_id === userClubId;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {match.tournament.division.label}
          {match.match_date && ` · Fecha ${match.match_date.number}`}
        </span>
        {live ? (
          <Badge variant="red" className="gap-1">
            <span className="live-dot" />
            {STATUS_LABELS[match.status]}
          </Badge>
        ) : (
          <Badge variant={finished ? 'gray' : 'default'}>
            {finished ? 'Finalizado' : formatDateTime(match.scheduled_at)}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center justify-end gap-2">
          <span className="text-right text-sm font-semibold leading-tight">
            {match.home_club.short_name ?? match.home_club.name}
          </span>
          {match.home_club.logo_url && (
            <Image src={match.home_club.logo_url} alt={match.home_club.name} width={28} height={28} className="object-contain" />
          )}
        </div>

        <div className="flex min-w-[56px] items-center justify-center gap-1 rounded-lg bg-slate-100 px-2 py-1">
          {finished || live ? (
            <>
              <span className="text-lg font-bold">{match.home_score}</span>
              <span className="text-slate-400">-</span>
              <span className="text-lg font-bold">{match.away_score}</span>
            </>
          ) : (
            <span className="text-sm font-medium text-slate-500">
              {formatTime(match.scheduled_at)}
            </span>
          )}
        </div>

        <div className="flex flex-1 items-center gap-2">
          {match.away_club.logo_url && (
            <Image src={match.away_club.logo_url} alt={match.away_club.name} width={28} height={28} className="object-contain" />
          )}
          <span className="text-sm font-semibold leading-tight">
            {match.away_club.short_name ?? match.away_club.name}
          </span>
        </div>
      </div>

      {match.stadium && (
        <p className="mt-2 text-center text-xs text-slate-400">{match.stadium}</p>
      )}

      <div className="mt-3 flex gap-2">
        <Link
          href={`/admin/partidos/${match.id}`}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          Editar
        </Link>
        {hasLive && canAccessLive && match.status !== 'cancelled' && match.status !== 'postponed' && (
          <Link
            href={`/admin/partidos/${match.id}/live`}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              live
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'border border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            {live ? '🔴 Control en vivo' : '▶ Panel en vivo'}
          </Link>
        )}
      </div>
    </div>
  );
}
