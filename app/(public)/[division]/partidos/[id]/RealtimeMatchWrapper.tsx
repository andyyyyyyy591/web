'use client';

import { useRealtimeMatch } from '@/hooks/useRealtimeMatch';
import { useRealtimeEvents } from '@/hooks/useRealtimeEvents';
import { MatchTabs } from './MatchTabs';
import type { MatchDetail } from '@/types';

interface RealtimeMatchWrapperProps {
  initialMatch: MatchDetail;
}

export function RealtimeMatchWrapper({ initialMatch }: RealtimeMatchWrapperProps) {
  const match = useRealtimeMatch(initialMatch);
  const events = useRealtimeEvents(initialMatch.id, initialMatch.events);

  const enrichedMatch: MatchDetail = {
    ...initialMatch,
    ...match,
    events,
  };

  return <MatchTabs match={enrichedMatch} />;
}
