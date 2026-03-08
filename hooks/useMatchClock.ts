'use client';

import { useEffect, useState } from 'react';
import { calculateMatchClock } from '@/lib/utils/match-clock';
import type { Match, MatchClock } from '@/types';

export function useMatchClock(match: Match): MatchClock {
  const [clock, setClock] = useState<MatchClock>(() => calculateMatchClock(match));

  useEffect(() => {
    setClock(calculateMatchClock(match));

    if (!['first_half', 'second_half', 'extra_time_first', 'extra_time_second'].includes(match.status)) {
      return;
    }

    const interval = setInterval(() => {
      setClock(calculateMatchClock(match));
    }, 30_000);

    return () => clearInterval(interval);
  }, [match]);

  return clock;
}
