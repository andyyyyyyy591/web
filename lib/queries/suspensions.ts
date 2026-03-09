import { createClient } from '@/lib/supabase/server';

export interface SuspendedPlayer {
  player_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  club_id: string;
  club_name: string;
  club_logo: string | null;
  reason: string;
  card_match_date: number | null;     // fecha en que recibió la tarjeta
  suspended_for_date: number;         // primera fecha suspendido
  suspended_until_date: number | null; // última fecha suspendido (null = solo una)
  served: boolean;
  /** If this came from a manual entry, its DB id (for edit/delete) */
  manual_id?: string;
  notes?: string | null;
}

export interface PlayerCards {
  player_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  club_id: string;
  club_name: string;
  club_logo: string | null;
  yellow_cards: number;
  red_cards: number;
  second_yellows: number;
}

export async function getSuspendedPlayers(tournamentId: string): Promise<SuspendedPlayer[]> {
  const supabase = await createClient();

  // 1. Get all finished matches with their match_date numbers
  const { data: matches } = await supabase
    .from('matches')
    .select('id, match_date_id, match_date:match_dates(number)')
    .eq('tournament_id', tournamentId)
    .eq('status', 'finished');

  // 2. Load manual suspensions for this tournament (public read policy, regular client OK)
  const { data: manualRows } = await supabase
    .from('player_suspensions')
    .select(`
      id, player_id, reason, card_match_date, suspended_for_date, suspended_until_date, notes,
      player:players(first_name, last_name, photo_url, club_id, club:clubs(name, logo_url))
    `)
    .eq('tournament_id', tournamentId);

  // Build manual suspensions list
  const manualSuspensions: SuspendedPlayer[] = [];
  for (const row of manualRows ?? []) {
    const player = (row.player as any) ?? {};
    const club = player.club ?? {};
    manualSuspensions.push({
      player_id: row.player_id,
      first_name: player.first_name ?? '',
      last_name: player.last_name ?? '',
      photo_url: player.photo_url ?? null,
      club_id: player.club_id ?? '',
      club_name: club.name ?? '',
      club_logo: club.logo_url ?? null,
      reason: row.reason,
      card_match_date: row.card_match_date ?? null,
      suspended_for_date: row.suspended_for_date,
      suspended_until_date: (row as any).suspended_until_date ?? null,
      served: false,
      manual_id: row.id,
      notes: row.notes,
    });
  }

  if (!matches?.length) {
    return manualSuspensions.sort((a, b) => a.suspended_for_date - b.suspended_for_date);
  }

  const finishedIds = matches.map((m) => m.id);

  // Build match_id → date_number map
  const matchDateMap = new Map<string, number>();
  let maxDateNum = 0;
  for (const m of matches) {
    const num = (m.match_date as any)?.number as number | undefined;
    if (num !== undefined) {
      matchDateMap.set(m.id, num);
      if (num > maxDateNum) maxDateNum = num;
    }
  }
  // Assign synthetic date numbers to dateless matches (e.g. interzonales sin fecha)
  let syntheticDate = maxDateNum + 1;
  for (const m of matches) {
    if (!matchDateMap.has(m.id)) matchDateMap.set(m.id, syntheticDate++);
  }

  // 3. Get all cards from finished matches
  const { data: cardEvents } = await supabase
    .from('match_events')
    .select(`
      id, type, match_id, player_id, club_id,
      player:players(first_name, last_name, photo_url),
      club:clubs(name, logo_url)
    `)
    .in('match_id', finishedIds)
    .in('type', ['yellow_card', 'second_yellow', 'red_card'])
    .not('player_id', 'is', null);

  // 4. Get all lineups to know if a player played after suspension
  const { data: lineups } = await supabase
    .from('match_lineups')
    .select('player_id, match_id')
    .in('match_id', finishedIds);

  // Build player_id → set of date_numbers they played in
  const playerMatchDates = new Map<string, Set<number>>();
  for (const lineup of lineups ?? []) {
    const dateNum = matchDateMap.get(lineup.match_id);
    if (dateNum === undefined) continue;
    if (!playerMatchDates.has(lineup.player_id)) {
      playerMatchDates.set(lineup.player_id, new Set());
    }
    playerMatchDates.get(lineup.player_id)!.add(dateNum);
  }

  const computedSuspensions: SuspendedPlayer[] = [];

  // Build a key set of manual overrides: "playerId-cardMatchDate" → manual suspended_for_date
  // Manual entries with card_match_date override the computed suspended_for_date
  const manualOverrideKeys = new Set(
    manualSuspensions
      .filter((m) => m.card_match_date !== null)
      .map((m) => `${m.player_id}-${m.card_match_date}`)
  );

  // 5. Process red cards and second yellows (1-match ban each)
  for (const event of cardEvents ?? []) {
    if (event.type !== 'red_card' && event.type !== 'second_yellow') continue;
    if (!event.player_id || !event.player) continue;

    const cardDateNum = matchDateMap.get(event.match_id);
    if (cardDateNum === undefined) continue;

    // Skip if there's a manual override for this card
    if (manualOverrideKeys.has(`${event.player_id}-${cardDateNum}`)) continue;

    const suspendedForDate = cardDateNum + 1;
    const playerDates = playerMatchDates.get(event.player_id) ?? new Set();
    const actuallyServed = [...playerDates].some((d) => d >= suspendedForDate);

    const player = event.player as any;
    const club = event.club as any;

    computedSuspensions.push({
      player_id: event.player_id,
      first_name: player.first_name,
      last_name: player.last_name,
      photo_url: player.photo_url,
      club_id: event.club_id,
      club_name: club.name,
      club_logo: club.logo_url,
      reason: event.type === 'red_card' ? 'Tarjeta roja' : 'Doble amarilla',
      card_match_date: cardDateNum,
      suspended_for_date: suspendedForDate,
      suspended_until_date: null,
      served: actuallyServed,
    });
  }

  // 6. Process yellow card accumulations (every 5 = 1 ban)
  type CardEvent = NonNullable<typeof cardEvents>[number];
  const yellowsByPlayer = new Map<string, Array<{ match_id: string; dateNum: number; event: CardEvent }>>();
  for (const event of cardEvents ?? []) {
    if (event.type !== 'yellow_card') continue;
    if (!event.player_id) continue;
    const dateNum = matchDateMap.get(event.match_id);
    if (dateNum === undefined) continue;
    if (!yellowsByPlayer.has(event.player_id)) yellowsByPlayer.set(event.player_id, []);
    yellowsByPlayer.get(event.player_id)!.push({ match_id: event.match_id, dateNum, event });
  }

  for (const [playerId, yellows] of yellowsByPlayer) {
    yellows.sort((a, b) => a.dateNum - b.dateNum);
    const player = yellows[0].event.player as any;
    const club = yellows[0].event.club as any;

    for (let threshold = 5; threshold <= yellows.length; threshold += 5) {
      const triggerEvent = yellows[threshold - 1];
      const cardDateNum = triggerEvent.dateNum;

      if (manualOverrideKeys.has(`${playerId}-${cardDateNum}`)) continue;

      const suspendedForDate = cardDateNum + 1;
      const playerDates = playerMatchDates.get(playerId) ?? new Set();
      const actuallyServed = [...playerDates].some((d) => d >= suspendedForDate);

      computedSuspensions.push({
        player_id: playerId,
        first_name: player.first_name,
        last_name: player.last_name,
        photo_url: player.photo_url,
        club_id: yellows[0].event.club_id,
        club_name: club.name,
        club_logo: club.logo_url,
        reason: `Acumulación de amarillas (${threshold})`,
        card_match_date: cardDateNum,
        suspended_for_date: suspendedForDate,
        suspended_until_date: null,
        served: actuallyServed,
      });
    }
  }

  // Mark served status for manual suspensions now that we have playerMatchDates
  for (const ms of manualSuspensions) {
    const playerDates = playerMatchDates.get(ms.player_id) ?? new Set();
    const lastSuspDate = ms.suspended_until_date ?? ms.suspended_for_date;
    ms.served = [...playerDates].some((d) => d >= lastSuspDate);
  }

  const all = [...computedSuspensions, ...manualSuspensions];

  return all.sort((a, b) => {
    if (a.served !== b.served) return a.served ? 1 : -1;
    return b.suspended_for_date - a.suspended_for_date;
  });
}

export async function getManualSuspensions(tournamentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('player_suspensions')
    .select(`
      id, player_id, reason, card_match_date, suspended_for_date, notes, created_at,
      player:players(first_name, last_name, photo_url, club_id, club:clubs(name))
    `)
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPlayerCards(tournamentId: string): Promise<PlayerCards[]> {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from('matches')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('status', 'finished');

  if (!matches?.length) return [];

  const finishedIds = matches.map((m) => m.id);

  const { data: events } = await supabase
    .from('match_events')
    .select(`
      type, player_id, club_id,
      player:players(first_name, last_name, photo_url),
      club:clubs(name, logo_url)
    `)
    .in('match_id', finishedIds)
    .in('type', ['yellow_card', 'second_yellow', 'red_card'])
    .not('player_id', 'is', null);

  const map = new Map<string, PlayerCards>();

  for (const e of events ?? []) {
    if (!e.player_id) continue;
    const p = e.player as any;
    const c = e.club as any;
    if (!map.has(e.player_id)) {
      map.set(e.player_id, {
        player_id: e.player_id,
        first_name: p.first_name,
        last_name: p.last_name,
        photo_url: p.photo_url,
        club_id: e.club_id,
        club_name: c.name,
        club_logo: c.logo_url,
        yellow_cards: 0,
        red_cards: 0,
        second_yellows: 0,
      });
    }
    const entry = map.get(e.player_id)!;
    if (e.type === 'yellow_card') entry.yellow_cards++;
    else if (e.type === 'red_card') entry.red_cards++;
    else if (e.type === 'second_yellow') entry.second_yellows++;
  }

  return Array.from(map.values()).sort(
    (a, b) => (b.yellow_cards + b.red_cards * 3 + b.second_yellows * 2)
      - (a.yellow_cards + a.red_cards * 3 + a.second_yellows * 2),
  );
}
