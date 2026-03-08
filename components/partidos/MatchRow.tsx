import Link from 'next/link';
import Image from 'next/image';
import type { MatchWithClubs } from '@/types';
import { isLive, LIVE_STATUSES } from '@/types';

function formatTime(scheduledAt: string | null): string {
  if (!scheduledAt) return '—';
  return new Date(scheduledAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_SHORT: Record<string, string> = {
  first_half: '1T',
  halftime: 'ET',
  second_half: '2T',
  extra_time_first: 'P.E.',
  extra_time_break: 'Desc.',
  extra_time_second: 'P.E.2',
  penalties: 'Pen.',
  finished: 'FIN',
  postponed: 'POST.',
  cancelled: 'CANC.',
};

interface Props {
  match: MatchWithClubs;
}

function ClubLogo({ url, name, size = 28 }: { url: string | null; name: string; size?: number }) {
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-elevated text-secondary font-bold"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function MatchRow({ match }: Props) {
  const live = isLive(match.status);
  const finished = match.status === 'finished';
  const divisionSlug = match.tournament.division.slug;
  const href = `/${divisionSlug}/partidos/${match.id}`;

  return (
    <Link href={href} className="flex items-center gap-2 px-4 py-3 hover:bg-elevated/60 transition-colors">
      {/* Home */}
      <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
        <span className={`truncate text-sm font-semibold text-right ${live ? 'text-primary' : finished ? 'text-secondary' : 'text-primary'}`}>
          {match.home_club.name}
        </span>
        <ClubLogo url={match.home_club.logo_url} name={match.home_club.name} />
      </div>

      {/* Center — score or time */}
      <div className="flex w-20 flex-shrink-0 flex-col items-center">
        {live ? (
          <>
            <div className="flex items-center gap-1.5 text-base font-bold text-primary">
              <span>{match.home_score}</span>
              <span className="text-secondary">–</span>
              <span>{match.away_score}</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="live-dot" style={{ width: 5, height: 5 }} />
              <span className="text-[10px] font-semibold text-live">{STATUS_SHORT[match.status] ?? 'LIVE'}</span>
            </div>
          </>
        ) : finished ? (
          <div className="flex items-center gap-1.5 text-base font-bold text-secondary">
            <span>{match.home_score}</span>
            <span>–</span>
            <span>{match.away_score}</span>
          </div>
        ) : match.status === 'scheduled' ? (
          <span className="text-sm font-semibold text-primary">{formatTime(match.scheduled_at)}</span>
        ) : (
          <span className="text-xs font-semibold text-secondary">{STATUS_SHORT[match.status] ?? match.status}</span>
        )}
      </div>

      {/* Away */}
      <div className="flex flex-1 items-center justify-start gap-2 min-w-0">
        <ClubLogo url={match.away_club.logo_url} name={match.away_club.name} />
        <span className={`truncate text-sm font-semibold ${live ? 'text-primary' : finished ? 'text-secondary' : 'text-primary'}`}>
          {match.away_club.name}
        </span>
      </div>
    </Link>
  );
}
