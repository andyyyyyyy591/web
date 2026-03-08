import Link from 'next/link';
import Image from 'next/image';
import type { MatchWithClubs } from '@/types';
import { STATUS_LABELS, isLive } from '@/types';
import { formatDateTime, formatTime } from '@/lib/utils/format';
import { Badge } from '@/components/ui/Badge';

interface MatchCardProps {
  match: MatchWithClubs;
}

export function MatchCard({ match }: MatchCardProps) {
  const live = isLive(match.status);
  const finished = match.status === 'finished';
  const divSlug = match.tournament.division.slug;
  const href = `/${divSlug}/partidos/${match.id}`;

  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
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
        {/* Local */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <span className="text-right text-sm font-semibold leading-tight">
            {match.home_club.short_name ?? match.home_club.name}
          </span>
          {match.home_club.logo_url && (
            <Image
              src={match.home_club.logo_url}
              alt={match.home_club.name}
              width={28}
              height={28}
              className="object-contain"
            />
          )}
        </div>

        {/* Marcador */}
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

        {/* Visitante */}
        <div className="flex flex-1 items-center gap-2">
          {match.away_club.logo_url && (
            <Image
              src={match.away_club.logo_url}
              alt={match.away_club.name}
              width={28}
              height={28}
              className="object-contain"
            />
          )}
          <span className="text-sm font-semibold leading-tight">
            {match.away_club.short_name ?? match.away_club.name}
          </span>
        </div>
      </div>

      {match.stadium && (
        <p className="mt-2 text-center text-xs text-slate-400">{match.stadium}</p>
      )}
    </Link>
  );
}
