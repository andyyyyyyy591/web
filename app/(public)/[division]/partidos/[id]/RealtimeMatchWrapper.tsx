'use client';

import { useRealtimeMatch } from '@/hooks/useRealtimeMatch';
import { useRealtimeEvents } from '@/hooks/useRealtimeEvents';
import { MatchTabs } from './MatchTabs';
import type { MatchDetail, MatchWithClubs } from '@/types';
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
  homeZone?: string | null;
  awayZone?: string | null;
  homeSuspended?: SuspendedEntry[];
  awaySuspended?: SuspendedEntry[];
  homeInjured?: InjuredEntry[];
  awayInjured?: InjuredEntry[];
  matchStaff?: MatchStaffEntry[];
  homeRecent?: MatchWithClubs[];
  awayRecent?: MatchWithClubs[];
}

export function RealtimeMatchWrapper({ initialMatch, homePosition, awayPosition, homeZone, awayZone, homeSuspended, awaySuspended, homeInjured, awayInjured, matchStaff, homeRecent, awayRecent }: RealtimeMatchWrapperProps) {
  const match = useRealtimeMatch(initialMatch);
  const events = useRealtimeEvents(initialMatch.id, initialMatch.events);

  const enrichedMatch: MatchDetail = {
    ...initialMatch,
    ...match,
    events,
  };

  return <MatchTabs match={enrichedMatch} homePosition={homePosition} awayPosition={awayPosition} homeZone={homeZone} awayZone={awayZone} homeSuspended={homeSuspended} awaySuspended={awaySuspended} homeInjured={homeInjured} awayInjured={awayInjured} matchStaff={matchStaff} homeRecent={homeRecent} awayRecent={awayRecent} />;
}
