import Image from 'next/image';
import type { MatchWithClubs } from '@/types';
import { STATUS_LABELS, isLive } from '@/types';

interface LiveScoreProps {
  match: MatchWithClubs;
}

export function LiveScore({ match }: LiveScoreProps) {
  const live = isLive(match.status);

  return (
    <div className="rounded-2xl bg-slate-900 p-6 text-white">
      {/* Estado */}
      <div className="mb-4 flex items-center justify-center gap-2">
        {live && <span className="live-dot" />}
        <span className={`text-sm font-semibold ${live ? 'text-red-400' : 'text-slate-400'}`}>
          {STATUS_LABELS[match.status]}
        </span>
      </div>

      {/* Equipos + marcador */}
      <div className="flex items-center justify-between gap-4">
        {/* Local */}
        <div className="flex flex-1 flex-col items-center gap-2">
          {match.home_club.logo_url && (
            <Image
              src={match.home_club.logo_url}
              alt={match.home_club.name}
              width={56}
              height={56}
              className="object-contain"
            />
          )}
          <span className="text-center text-sm font-semibold">{match.home_club.name}</span>
        </div>

        {/* Marcador */}
        <div className="flex items-center gap-3">
          <span className="text-5xl font-black tabular-nums">{match.home_score}</span>
          <span className="text-2xl text-slate-500">-</span>
          <span className="text-5xl font-black tabular-nums">{match.away_score}</span>
        </div>

        {/* Visitante */}
        <div className="flex flex-1 flex-col items-center gap-2">
          {match.away_club.logo_url && (
            <Image
              src={match.away_club.logo_url}
              alt={match.away_club.name}
              width={56}
              height={56}
              className="object-contain"
            />
          )}
          <span className="text-center text-sm font-semibold">{match.away_club.name}</span>
        </div>
      </div>

      {/* Info adicional */}
      <div className="mt-4 flex justify-center gap-4 text-xs text-slate-400">
        {match.stadium && <span>{match.stadium}</span>}
        {match.tournament.season.name && (
          <span>{match.tournament.division.label} · {match.tournament.season.name}</span>
        )}
      </div>
    </div>
  );
}
