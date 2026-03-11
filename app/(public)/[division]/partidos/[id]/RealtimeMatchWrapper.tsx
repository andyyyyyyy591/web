'use client';

import { useRealtimeMatch } from '@/hooks/useRealtimeMatch';
import { useRealtimeEvents } from '@/hooks/useRealtimeEvents';
import { MatchTabs } from './MatchTabs';
import type { MatchDetail } from '@/types';
import type { MatchStaffEntry } from '@/lib/queries/coaching-staff';

interface SuspendedEntry {
  player_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  reason: string;
}

interface InjuredEntry {
  player_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  description: string;
  estimated_recovery: string | null;
}

interface RealtimeMatchWrapperProps {
  initialMatch: MatchDetail;
  homePosition?: number;
  awayPosition?: number;
  homeSuspended?: SuspendedEntry[];
  awaySuspended?: SuspendedEntry[];
  homeInjured?: InjuredEntry[];
  awayInjured?: InjuredEntry[];
  matchStaff?: MatchStaffEntry[];
}

export function RealtimeMatchWrapper({ initialMatch, homePosition, awayPosition, homeSuspended, awaySuspended, homeInjured, awayInjured, matchStaff }: RealtimeMatchWrapperProps) {
  const match = useRealtimeMatch(initialMatch);
  const events = useRealtimeEvents(initialMatch.id, initialMatch.events);

  const enrichedMatch: MatchDetail = {
    ...initialMatch,
    ...match,
    events,
  };

  return <MatchTabs match={enrichedMatch} homePosition={homePosition} awayPosition={awayPosition} homeSuspended={homeSuspended} awaySuspended={awaySuspended} homeInjured={homeInjured} awayInjured={awayInjured} matchStaff={matchStaff} />;
}
