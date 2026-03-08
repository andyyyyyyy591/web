import type { Match, MatchClock } from '@/types';

const HALF_DURATION = 45;
const EXTRA_DURATION = 15;

export function calculateMatchClock(match: Match): MatchClock {
  const now = Date.now();

  switch (match.status) {
    case 'first_half': {
      if (!match.started_at) return { minute: 1, addedTime: 0, period: 'first_half', isLive: true };
      const elapsed = Math.floor((now - new Date(match.started_at).getTime()) / 60000);
      const minute = Math.min(elapsed + 1, HALF_DURATION + match.first_half_added_time);
      const addedTime = minute > HALF_DURATION ? minute - HALF_DURATION : 0;
      return {
        minute: Math.min(minute, HALF_DURATION),
        addedTime,
        period: 'first_half',
        isLive: true,
      };
    }

    case 'halftime':
      return { minute: 45, addedTime: 0, period: null, isLive: true };

    case 'second_half': {
      if (!match.second_half_at) return { minute: 46, addedTime: 0, period: 'second_half', isLive: true };
      const elapsed = Math.floor((now - new Date(match.second_half_at).getTime()) / 60000);
      const raw = HALF_DURATION + elapsed + 1;
      const max = 90 + match.second_half_added_time;
      const minute = Math.min(raw, max);
      const addedTime = minute > 90 ? minute - 90 : 0;
      return {
        minute: Math.min(minute, 90),
        addedTime,
        period: 'second_half',
        isLive: true,
      };
    }

    case 'extra_time_first': {
      if (!match.extra_time_first_at) return { minute: 91, addedTime: 0, period: 'extra_time_first', isLive: true };
      const elapsed = Math.floor((now - new Date(match.extra_time_first_at).getTime()) / 60000);
      const minute = Math.min(90 + elapsed + 1, 90 + EXTRA_DURATION);
      return { minute, addedTime: 0, period: 'extra_time_first', isLive: true };
    }

    case 'extra_time_break':
      return { minute: 105, addedTime: 0, period: null, isLive: true };

    case 'extra_time_second': {
      if (!match.extra_time_second_at) return { minute: 106, addedTime: 0, period: 'extra_time_second', isLive: true };
      const elapsed = Math.floor((now - new Date(match.extra_time_second_at).getTime()) / 60000);
      const minute = Math.min(105 + elapsed + 1, 120);
      return { minute, addedTime: 0, period: 'extra_time_second', isLive: true };
    }

    case 'penalties':
      return { minute: 120, addedTime: 0, period: 'penalties', isLive: true };

    case 'finished':
      return { minute: 90, addedTime: 0, period: null, isLive: false };

    default:
      return { minute: 0, addedTime: 0, period: null, isLive: false };
  }
}
