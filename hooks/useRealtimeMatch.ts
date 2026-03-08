'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Match } from '@/types';

export function useRealtimeMatch(initialMatch: Match) {
  const [match, setMatch] = useState<Match>(initialMatch);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`match-${initialMatch.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${initialMatch.id}`,
        },
        (payload) => {
          setMatch((prev) => ({ ...prev, ...(payload.new as Partial<Match>) }));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialMatch.id]);

  return match;
}
