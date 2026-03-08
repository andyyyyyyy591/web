import Image from 'next/image';
import type { TopScorer } from '@/types';
import { formatPlayerName } from '@/lib/utils/format';

interface TopScorersProps {
  scorers: TopScorer[];
  compact?: boolean;
}

export function TopScorers({ scorers, compact = false }: TopScorersProps) {
  const rows = compact ? scorers.slice(0, 5) : scorers;

  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">Sin goleadores registrados</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {rows.map((s, i) => (
        <div
          key={`${s.player_id}-${s.tournament_id}`}
          className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0"
        >
          <span className="w-6 text-right text-sm font-bold text-slate-400">{i + 1}</span>
          {s.photo_url ? (
            <Image
              src={s.photo_url}
              alt={formatPlayerName(s.first_name, s.last_name)}
              width={36}
              height={36}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-slate-200" />
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {formatPlayerName(s.first_name, s.last_name)}
            </p>
            <p className="truncate text-xs text-slate-500">{s.club_name}</p>
          </div>
          <span className="text-xl font-black text-slate-900">{s.goals}</span>
          <span className="text-xs text-slate-400">goles</span>
        </div>
      ))}
    </div>
  );
}
