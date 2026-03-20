'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { MatchWithClubs } from '@/types';
import { isLive } from '@/types';
import { calculateMatchClock } from '@/lib/utils/match-clock';

function formatScheduled(scheduledAt: string | null): { date: string; time: string } {
  if (!scheduledAt) return { date: '', time: '—' };
  const d = new Date(scheduledAt);
  return {
    date: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
    time: d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
  };
}

const STATUS_SHORT: Record<string, string> = {
  halftime:          'Entretiempo',
  extra_time_break:  'Desc. ET',
  extra_time_second: 'Prórroga 2',
  penalties:         'Penales',
  finished:          'Final',
  postponed:         'Postergado',
  cancelled:         'Cancelado',
};

function LiveMinute({ match }: { match: MatchWithClubs }) {
  const [clock, setClock] = useState(() => calculateMatchClock(match));

  useEffect(() => {
    setClock(calculateMatchClock(match));
    if (!['first_half', 'second_half', 'extra_time_first', 'extra_time_second'].includes(match.status)) return;
    const id = setInterval(() => setClock(calculateMatchClock(match)), 10_000);
    return () => clearInterval(id);
  }, [match]);

  const display = clock.addedTime > 0
    ? `${clock.minute}+${clock.addedTime}'`
    : `${clock.minute}'`;

  return (
    <div className="flex items-center gap-1">
      <span className="live-dot" style={{ width: 5, height: 5 }} />
      <span className="text-[10px] font-bold text-live">{display}</span>
    </div>
  );
}

function ClubLogo({ url, name, size = 28 }: { url: string | null; name: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  if (url && !imgError) {
    return (
      <Image src={url} alt={name} width={size} height={size}
        className="rounded-full object-contain shrink-0" style={{ width: size, height: size }}
        onError={() => setImgError(true)} />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-elevated text-secondary font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

interface Props {
  match: MatchWithClubs;
}

export function MatchRow({ match }: Props) {
  const live = isLive(match.status);
  const finished = match.status === 'finished';
  const scheduled = match.status === 'scheduled';
  const hasScore = !scheduled && match.status !== 'postponed' && match.status !== 'cancelled';
  const divisionSlug = match.tournament.division.slug;
  const href = `/${divisionSlug}/partidos/${match.id}`;
  const { date, time } = formatScheduled(match.scheduled_at);

  return (
    <Link
      href={href}
      className={`block rounded-2xl border px-4 py-3 transition-colors hover:bg-elevated/60 ${
        live ? 'border-live/30 bg-live/5' : 'border-border bg-card'
      }`}
    >
      {/* Top row: division + date + status */}
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-secondary min-w-0">
          <span className="truncate">{match.tournament.division.label}</span>
          {(match as any).match_date?.number && (
            <span className="shrink-0">· Fecha {(match as any).match_date.number}</span>
          )}
          {(match as any).round_label && (
            <span className="shrink-0 font-semibold">· {(match as any).round_label}</span>
          )}
          {match.match_zone && (
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
              match.match_zone === 'interzonal'
                ? 'bg-orange-500/15 text-orange-400'
                : 'bg-purple-500/15 text-purple-400'
            }`}>
              {match.match_zone === 'zona_a' ? 'Zona A' : match.match_zone === 'zona_b' ? 'Zona B' : 'IZ'}
            </span>
          )}
        </div>

        {/* Status / time badge */}
        {live ? (
          <div className="flex items-center gap-1 shrink-0">
            <span className="live-dot" style={{ width: 6, height: 6 }} />
            <span className="text-[11px] font-bold text-live">
              {STATUS_SHORT[match.status] ?? 'EN VIVO'}
            </span>
          </div>
        ) : scheduled ? (
          <div className="flex items-center gap-1 shrink-0 text-[11px] text-secondary">
            {date && <span>{date}</span>}
            <span className="font-semibold text-primary">{time}</span>
          </div>
        ) : (
          <span className="shrink-0 text-[11px] font-semibold text-secondary">
            {STATUS_SHORT[match.status] ?? match.status}
          </span>
        )}
      </div>

      {/* Teams + score */}
      <div className="flex items-center justify-between gap-2">
        {/* Home */}
        <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
          <span className={`truncate text-sm font-semibold text-right ${finished ? 'text-secondary' : 'text-primary'}`}>
            {match.home_club.name}
          </span>
          <ClubLogo url={match.home_club.logo_url} name={match.home_club.name} />
        </div>

        {/* Score pill */}
        <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-elevated px-3 py-1.5 tabular-nums">
          {live ? (
            <>
              <span className="text-lg font-black text-primary">{match.home_score}</span>
              <span className="text-secondary">—</span>
              <span className="text-lg font-black text-primary">{match.away_score}</span>
            </>
          ) : hasScore ? (
            <>
              <span className={`text-lg font-black ${finished ? 'text-secondary' : 'text-primary'}`}>{match.home_score}</span>
              <span className="text-secondary">—</span>
              <span className={`text-lg font-black ${finished ? 'text-secondary' : 'text-primary'}`}>{match.away_score}</span>
            </>
          ) : (
            <span className="text-sm font-medium text-secondary px-1">vs</span>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-1 items-center justify-start gap-2 min-w-0">
          <ClubLogo url={match.away_club.logo_url} name={match.away_club.name} />
          <span className={`truncate text-sm font-semibold ${finished ? 'text-secondary' : 'text-primary'}`}>
            {match.away_club.name}
          </span>
        </div>
      </div>

      {/* Live clock row (when active) */}
      {live && ['first_half', 'second_half', 'extra_time_first', 'extra_time_second'].includes(match.status) && (
        <div className="mt-2 flex justify-center">
          <LiveMinute match={match} />
        </div>
      )}
    </Link>
  );
}
