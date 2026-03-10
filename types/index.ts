// ============================================================
// Liga de Fútbol — TypeScript Types
// ============================================================

// ────────────────────────────────────────────────
// ENUMS
// ────────────────────────────────────────────────

export type DivisionName = 'primera' | 'reserva' | 'cuarta' | 'quinta' | 'septima';

export type MatchStatus =
  | 'scheduled'
  | 'first_half'
  | 'halftime'
  | 'second_half'
  | 'extra_time_first'
  | 'extra_time_break'
  | 'extra_time_second'
  | 'penalties'
  | 'finished'
  | 'postponed'
  | 'cancelled';

export type EventType =
  | 'goal'
  | 'own_goal'
  | 'penalty_goal'
  | 'penalty_missed'
  | 'yellow_card'
  | 'second_yellow'
  | 'red_card'
  | 'substitution'
  | 'var_review';

export type MatchPeriod =
  | 'first_half'
  | 'second_half'
  | 'extra_time_first'
  | 'extra_time_second'
  | 'penalties';

export type PlayerPosition =
  | 'goalkeeper'
  | 'right_back'
  | 'center_back'
  | 'left_back'
  | 'defensive_mid'
  | 'central_mid'
  | 'attacking_mid'
  | 'right_wing'
  | 'left_wing'
  | 'second_striker'
  | 'striker';

// ────────────────────────────────────────────────
// ENTIDADES BASE (espejo del schema SQL)
// ────────────────────────────────────────────────

export interface Club {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  founded_year: number | null;
  extra_info: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Season {
  id: string;
  name: string;
  year: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Division {
  id: string;
  name: DivisionName;
  label: string;
  slug: string;
  has_live_mode: boolean;
  display_order: number;
  created_at: string;
}

export interface CoachingStaff {
  id: string;
  club_id: string;
  division_id: string | null;
  first_name: string;
  last_name: string;
  role: string;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Player {
  id: string;
  club_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  position: PlayerPosition | null;
  photo_url: string | null;
  nationality: string;
  jersey_number: number | null;
  plays_in_primera: boolean;
  primary_division_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TournamentFormat = 'todos_contra_todos' | 'zonas' | 'eliminatorias';

export interface Tournament {
  id: string;
  season_id: string;
  division_id: string;
  name: string;
  is_active: boolean;
  format: TournamentFormat;
  created_at: string;
}

export interface MatchDate {
  id: string;
  tournament_id: string;
  number: number;
  label: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  is_current: boolean;
  created_at: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  match_date_id: string | null;
  home_club_id: string;
  away_club_id: string;
  scheduled_at: string | null;
  stadium: string | null;
  status: MatchStatus;
  home_score: number;
  away_score: number;
  // Timestamps para reloj en vivo
  started_at: string | null;
  halftime_at: string | null;
  second_half_at: string | null;
  extra_time_first_at: string | null;
  extra_time_break_at: string | null;
  extra_time_second_at: string | null;
  finished_at: string | null;
  // Tiempo adicional
  first_half_added_time: number;
  second_half_added_time: number;
  // Árbitros
  referee: string | null;
  referee_assistant_1: string | null;
  referee_assistant_2: string | null;
  referee_fourth: string | null;
  notes: string | null;
  zone: string | null;
  round_label: string | null;
  match_zone: 'zona_a' | 'zona_b' | 'interzonal' | null;
  penalty_winner_club_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchLineup {
  id: string;
  match_id: string;
  club_id: string;
  player_id: string;
  is_starter: boolean;
  shirt_number: number | null;
  position_label: string | null;   // "GK", "CB", "CAM"…
  field_x: number | null;          // 0–100 para visualizar la formación
  field_y: number | null;
  created_at: string;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  minute: number;
  added_time: number;              // para 45+3, este campo = 3
  period: MatchPeriod;
  type: EventType;
  club_id: string;
  player_id: string | null;
  secondary_player_id: string | null;
  description: string | null;
  created_at: string;
}

export interface Standing {
  id: string;
  tournament_id: string;
  club_id: string;
  zone: string | null;             // 'A' | 'B' | null
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;         // columna generada en DB
  points: number;
  updated_at: string;
}

export interface TournamentClub {
  id: string;
  tournament_id: string;
  club_id: string;
  zone: string | null;
  created_at: string;
}

// ────────────────────────────────────────────────
// TIPOS ENRIQUECIDOS (con joins)
// ────────────────────────────────────────────────

export interface PlayerWithClub extends Player {
  club: Club;
}

export interface TournamentWithRelations extends Tournament {
  season: Season;
  division: Division;
}

export interface MatchWithClubs extends Match {
  home_club: Club;
  away_club: Club;
  tournament: TournamentWithRelations;
  match_date: MatchDate | null;
}

export interface MatchEventWithPlayers extends MatchEvent {
  player: Player | null;
  secondary_player: Player | null;
  club: Club;
}

export interface MatchLineupWithPlayer extends MatchLineup {
  player: Player;
}

/** Partido completo con todos los datos para la página de detalle */
export interface MatchDetail extends MatchWithClubs {
  events: MatchEventWithPlayers[];
  home_starters: MatchLineupWithPlayer[];
  home_subs: MatchLineupWithPlayer[];
  away_starters: MatchLineupWithPlayer[];
  away_subs: MatchLineupWithPlayer[];
}

export interface StandingWithClub extends Standing {
  club: Club;
}

export interface MatchDateWithMatches extends MatchDate {
  matches: MatchWithClubs[];
}

// ────────────────────────────────────────────────
// VISTA: top_scorers
// ────────────────────────────────────────────────

export interface TopScorer {
  player_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  club_id: string;
  club_name: string;
  club_logo: string | null;
  tournament_id: string;
  tournament_name: string;
  division_id: string;
  division_name: DivisionName;
  division_slug: string;
  goals: number;
}

// ────────────────────────────────────────────────
// VISTA: live_matches
// ────────────────────────────────────────────────

export interface LiveMatch extends Match {
  home_club_name: string;
  home_club_logo: string | null;
  home_club_slug: string;
  away_club_name: string;
  away_club_logo: string | null;
  away_club_slug: string;
  division_name: DivisionName;
  division_slug: string;
  division_label: string;
}

// ────────────────────────────────────────────────
// RELOJ EN VIVO (calculado en cliente)
// ────────────────────────────────────────────────

export interface MatchClock {
  minute: number;
  addedTime: number;
  period: MatchPeriod | null;
  isLive: boolean;
}

// ────────────────────────────────────────────────
// PAYLOADS DE ADMIN
// ────────────────────────────────────────────────

export interface CreateMatchPayload {
  tournament_id: string;
  match_date_id?: string;
  home_club_id: string;
  away_club_id: string;
  scheduled_at?: string;
  stadium?: string;
  referee?: string;
  referee_assistant_1?: string;
  referee_assistant_2?: string;
  referee_fourth?: string;
  notes?: string;
  zone?: string;
  round_label?: string;
  match_zone?: 'zona_a' | 'zona_b' | 'interzonal';
}

export interface UpdateMatchPayload {
  home_club_id?: string;
  away_club_id?: string;
  home_score?: number | null;
  away_score?: number | null;
  scheduled_at?: string;
  stadium?: string;
  referee?: string;
  referee_assistant_1?: string;
  referee_assistant_2?: string;
  referee_fourth?: string;
  notes?: string;
  image_url?: string;
  zone?: string | null;
  round_label?: string | null;
  match_zone?: 'zona_a' | 'zona_b' | 'interzonal' | null;
}

export interface AddMatchEventPayload {
  match_id: string;
  minute: number;
  added_time?: number;
  period: MatchPeriod;
  type: EventType;
  club_id: string;
  player_id?: string;
  secondary_player_id?: string;
  description?: string;
}

export interface UpdateMatchStatusPayload {
  status: MatchStatus;
  // El campo de timestamp se setea automáticamente según el status
  first_half_added_time?: number;
  second_half_added_time?: number;
}

export interface UpsertLineupPlayerPayload {
  match_id: string;
  club_id: string;
  player_id: string;
  is_starter: boolean;
  shirt_number?: number;
  position_label?: string;
  field_x?: number;
  field_y?: number;
}

export interface CreatePlayerPayload {
  club_id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  position?: PlayerPosition;
  photo_url?: string;
  nationality?: string;
  jersey_number?: number;
  plays_in_primera?: boolean;
  primary_division_id?: string | null;
}

export interface UpdatePlayerPayload {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  position?: PlayerPosition;
  photo_url?: string;
  nationality?: string;
  jersey_number?: number;
  plays_in_primera?: boolean;
  primary_division_id?: string | null;
  is_active?: boolean;
}

export interface CreateClubPayload {
  name: string;
  short_name?: string;
  slug: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  founded_year?: number;
  extra_info?: string;
}

export interface UpdateClubPayload {
  name?: string;
  short_name?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  founded_year?: number;
  extra_info?: string;
  is_active?: boolean;
}

// ────────────────────────────────────────────────
// TROFEOS
// ────────────────────────────────────────────────

export interface Trophy {
  id: string;
  club_id: string;
  name: string;
  year: number | null;
  image_url: string | null;
  created_at: string;
}

export interface CreateTrophyPayload {
  club_id: string;
  name: string;
  year?: number;
  image_url?: string;
}

// ────────────────────────────────────────────────
// FICHAJES / TRANSFERS
// ────────────────────────────────────────────────

export interface Transfer {
  id: string;
  player_id: string;
  club_id: string;
  type: 'in' | 'out';
  season_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface TransferWithPlayer extends Transfer {
  player: Player;
  season: Season | null;
}

export interface CreateTransferPayload {
  player_id: string;
  club_id: string;
  type: 'in' | 'out';
  season_id?: string;
  notes?: string;
}

export interface CreateSeasonPayload {
  name: string;
  year: number;
  start_date?: string;
  end_date?: string;
  image_url?: string;
}

// ────────────────────────────────────────────────
// NOTICIAS
// ────────────────────────────────────────────────

export interface News {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNewsPayload {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  image_url?: string;
  published_at?: string;
  is_published?: boolean;
}

// ────────────────────────────────────────────────
// ROLES DE ADMIN
// ────────────────────────────────────────────────

export type AdminRole = 'admin' | 'team_admin';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  club_id: string | null;
  created_at: string;
}

// ────────────────────────────────────────────────
// HELPERS / UTILIDADES
// ────────────────────────────────────────────────

/** Estados que implican que el partido está en curso */
export const LIVE_STATUSES: MatchStatus[] = [
  'first_half',
  'halftime',
  'second_half',
  'extra_time_first',
  'extra_time_break',
  'extra_time_second',
  'penalties',
];

/** Tipos de evento que cuentan como gol */
export const GOAL_TYPES: EventType[] = ['goal', 'penalty_goal', 'own_goal'];

/** Tipos de evento que implican tarjeta */
export const CARD_TYPES: EventType[] = ['yellow_card', 'second_yellow', 'red_card'];

export function isLive(status: MatchStatus): boolean {
  return LIVE_STATUSES.includes(status);
}

export function isGoalEvent(type: EventType): boolean {
  return GOAL_TYPES.includes(type);
}

export function getPlayerFullName(player: Pick<Player, 'first_name' | 'last_name'>): string {
  return `${player.first_name} ${player.last_name}`;
}

export function getEventMinuteLabel(event: Pick<MatchEvent, 'minute' | 'added_time'>): string {
  return event.added_time > 0
    ? `${event.minute}+${event.added_time}'`
    : `${event.minute}'`;
}

/** Etiquetas de posición para mostrar en UI */
export const POSITION_LABELS: Record<PlayerPosition, string> = {
  goalkeeper:    'Arquero',
  right_back:    'Lateral derecho',
  center_back:   'Central',
  left_back:     'Lateral izquierdo',
  defensive_mid: 'Volante defensivo',
  central_mid:   'Volante central',
  attacking_mid: 'Volante ofensivo',
  right_wing:    'Extremo derecho',
  left_wing:     'Extremo izquierdo',
  second_striker:'Segundo delantero',
  striker:       'Delantero',
};

export const STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled:          'Programado',
  first_half:         '1° Tiempo',
  halftime:           'Descanso',
  second_half:        '2° Tiempo',
  extra_time_first:   'T. Extra 1°',
  extra_time_break:   'Descanso T.E.',
  extra_time_second:  'T. Extra 2°',
  penalties:          'Penales',
  finished:           'Finalizado',
  postponed:          'Postergado',
  cancelled:          'Cancelado',
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  goal:           'Gol',
  own_goal:       'Gol en contra',
  penalty_goal:   'Penal convertido',
  penalty_missed: 'Penal fallado',
  yellow_card:    'Tarjeta amarilla',
  second_yellow:  'Segunda amarilla',
  red_card:       'Tarjeta roja',
  substitution:   'Cambio',
  var_review:     'Revisión VAR',
};
