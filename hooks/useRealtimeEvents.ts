'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { MatchEventWithPlayers } from '@/types';

export function useRealtimeEvents(matchId: string, initialEvents: MatchEventWithPlayers[]) {
  const [events, setEvents] = useState<MatchEventWithPlayers[]>(initialEvents);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`match-events-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'match_events',
          filter: `match_id=eq.${matchId}`,
        },
        async (payload) => {
          // Enriquecer el evento con joins
          const { data } = await supabase
            .from('match_events')
            .select(`
              *,
              player:players!match_events_player_id_fkey(*),
              secondary_player:players!match_events_secondary_player_id_fkey(*),
              club:clubs(*)
            `)
            .eq('id', (payload.new as { id: string }).id)
            .single();
          if (data) {
            setEvents((prev) =>
              [...prev, data as MatchEventWithPlayers].sort((a, b) => {
                if (a.minute !== b.minute) return a.minute - b.minute;
                return a.added_time - b.added_time;
              }),
            );
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'match_events',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          setEvents((prev) =>
            prev.filter((e) => e.id !== (payload.old as { id: string }).id),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  return events;
}
