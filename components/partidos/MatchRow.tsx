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
  halftime:          'ET',
  extra_time_break:  'Desc.',
  extra_time_second: 'P.E.2',
  penalties:         'Pen.',
  finished:          'FIN',
  postponed:         'POST.',
  cancelled:         'CANC.',
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
    <div className="flex items-center gap-1 mt-0.5">
      <span className="live-dot" style={{ width: 5, height: 5 }} />
      <span className="text-[10px] font-bold text-live">{display}</span>
    </div>
  );
}

interface Props {
  match: MatchWithClubs;
}

function ClubLogo({ url, name, size = 28 }: { url: string | null; name: string; size?: number }) {
  if (url) {
    return (
      <Image src={url} alt={name} width={size} height={size}
        className="rounded-full object-contain" style={{ width: size, height: size }} />
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
        <span className={`truncate text-sm font-semibold text-right ${finished ? 'text-secondary' : 'text-primary'}`}>
          {match.home_club.name}
        </span>
        <ClubLogo url={match.home_club.logo_url} name={match.home_club.name} />
      </div>

      {/* Center */}
      <div className="flex w-20 flex-shrink-0 flex-col items-center">
        {live ? (
          <>
            <div className="flex items-center gap-1.5 text-base font-bold text-primary">
              <span>{match.home_score}</span>
              <span className="text-secondary">–</span>
              <span>{match.away_score}</span>
            </div>
            {['first_half', 'second_half', 'extra_time_first', 'extra_time_second'].includes(match.status) ? (
              <LiveMinute match={match} />
            ) : (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="live-dot" style={{ width: 5, height: 5 }} />
                <span className="text-[10px] font-bold text-live">{STATUS_SHORT[match.status] ?? 'EN VIVO'}</span>
              </div>
            )}
          </>
        ) : finished ? (
          <div className="flex items-center gap-1.5 text-base font-bold text-secondary">
            <span>{match.home_score}</span>
            <span>–</span>
            <span>{match.away_score}</span>
          </div>
        ) : match.status === 'scheduled' ? (
          (() => {
            const { date, time } = formatScheduled(match.scheduled_at);
            return (
              <div className="flex flex-col items-center leading-tight">
                {date && <span className="text-[10px] text-secondary">{date}</span>}
                <span className="text-sm font-semibold text-primary">{time}</span>
              </div>
            );
          })()
        ) : (
          <span className="text-xs font-semibold text-secondary">{STATUS_SHORT[match.status] ?? match.status}</span>
        )}
      </div>

      {/* Away */}
      <div className="flex flex-1 items-center justify-start gap-2 min-w-0">
        <ClubLogo url={match.away_club.logo_url} name={match.away_club.name} />
        <span className={`truncate text-sm font-semibold ${finished ? 'text-secondary' : 'text-primary'}`}>
          {match.away_club.name}
        </span>
      </div>
    </Link>
  );
}
