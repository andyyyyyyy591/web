'use client';

import { useRealtimeMatch } from '@/hooks/useRealtimeMatch';
import { useRealtimeEvents } from '@/hooks/useRealtimeEvents';
import { MatchTabs } from './MatchTabs';
import type { MatchDetail } from '@/types';

interface SuspendedEntry {
  player_id: string;
  first_name: string;
  last_name: string;
}

interface RealtimeMatchWrapperProps {
  initialMatch: MatchDetail;
  homePosition?: number;
  awayPosition?: number;
  homeSuspended?: SuspendedEntry[];
  awaySuspended?: SuspendedEntry[];
}

export function RealtimeMatchWrapper({ initialMatch, homePosition, awayPosition, homeSuspended, awaySuspended }: RealtimeMatchWrapperProps) {
  const match = useRealtimeMatch(initialMatch);
  const events = useRealtimeEvents(initialMatch.id, initialMatch.events);

  const enrichedMatch: MatchDetail = {
    ...initialMatch,
    ...match,
    events,
  };

  return <MatchTabs match={enrichedMatch} homePosition={homePosition} awayPosition={awayPosition} homeSuspended={homeSuspended} awaySuspended={awaySuspended} />;
}
