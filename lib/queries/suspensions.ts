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
  card_match_date: number;       // fecha en que recibió la tarjeta
  suspended_for_date: number;    // fecha en que está suspendido
  served: boolean;               // si ya jugó después de la tarjeta
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

  if (!matches?.length) return [];

  const finishedIds = matches.map((m) => m.id);

  // Build match_id → date_number map
  const matchDateMap = new Map<string, number>();
  for (const m of matches) {
    const num = (m.match_date as any)?.number as number | undefined;
    if (num !== undefined) matchDateMap.set(m.id, num);
  }

  // 2. Get all cards from finished matches
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

  if (!cardEvents?.length) return [];

  // 3. Get all lineups to know if a player played in a match after suspension
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

  // 4. Calculate current max match_date number
  const maxDateNum = Math.max(...Array.from(matchDateMap.values()), 0);

  const suspensions: SuspendedPlayer[] = [];

  // 5. Process red cards and second yellows (1-match ban each)
  for (const event of cardEvents) {
    if (event.type !== 'red_card' && event.type !== 'second_yellow') continue;
    if (!event.player_id || !event.player) continue;

    const cardDateNum = matchDateMap.get(event.match_id);
    if (cardDateNum === undefined) continue;

    const suspendedForDate = cardDateNum + 1;
    const playerDates = playerMatchDates.get(event.player_id) ?? new Set();
    const served = playerDates.has(suspendedForDate) || playerDates.size > 0 && Math.min(...playerDates) > suspendedForDate;
    // Served if player played in suspendedForDate or later
    const actuallyServed = [...playerDates].some((d) => d >= suspendedForDate);

    const player = event.player as any;
    const club = event.club as any;

    suspensions.push({
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
      served: actuallyServed,
    });
  }

  // 6. Process yellow card accumulations (every 5 = 1 ban)
  // Group yellows by player, ordered by match_date
  const yellowsByPlayer = new Map<string, Array<{ match_id: string; dateNum: number; event: typeof cardEvents[0] }>>();
  for (const event of cardEvents) {
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

    // Check each threshold (5, 10, 15...)
    for (let threshold = 5; threshold <= yellows.length; threshold += 5) {
      const triggerEvent = yellows[threshold - 1];
      const suspendedForDate = triggerEvent.dateNum + 1;
      const playerDates = playerMatchDates.get(playerId) ?? new Set();
      const actuallyServed = [...playerDates].some((d) => d >= suspendedForDate);

      suspensions.push({
        player_id: playerId,
        first_name: player.first_name,
        last_name: player.last_name,
        photo_url: player.photo_url,
        club_id: yellows[0].event.club_id,
        club_name: club.name,
        club_logo: club.logo_url,
        reason: `Acumulación de amarillas (${threshold})`,
        card_match_date: triggerEvent.dateNum,
        suspended_for_date: suspendedForDate,
        served: actuallyServed,
      });
    }
  }

  // Sort: pending first, then by suspended_for_date desc
  return suspensions.sort((a, b) => {
    if (a.served !== b.served) return a.served ? 1 : -1;
    return b.suspended_for_date - a.suspended_for_date;
  });
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
