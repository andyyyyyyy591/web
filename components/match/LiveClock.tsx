'use client';

import { useMatchClock } from '@/hooks/useMatchClock';
import type { Match } from '@/types';

interface LiveClockProps {
  match: Match;
}

export function LiveClock({ match }: LiveClockProps) {
  const clock = useMatchClock(match);

  if (!clock.isLive || clock.minute === 0) return null;

  const display = clock.addedTime > 0
    ? `${clock.minute}+${clock.addedTime}'`
    : `${clock.minute}'`;

  return (
    <div className="flex items-center justify-center gap-1.5 text-live">
      <span className="live-dot" />
      <span className="text-sm font-bold tabular-nums">{display}</span>
    </div>
  );
}
