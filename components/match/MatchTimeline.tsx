import type { MatchEventWithPlayers, MatchStatus } from '@/types';
import { EVENT_TYPE_LABELS, GOAL_TYPES, CARD_TYPES } from '@/types';
import { getEventMinuteLabel } from '@/types';
import { formatPlayerShort } from '@/lib/utils/format';

interface MatchTimelineProps {
  events: MatchEventWithPlayers[];
  homeClubId: string;
  status?: MatchStatus;
  firstHalfAddedTime?: number;
  secondHalfAddedTime?: number;
}

type TimelineItem =
  | { kind: 'event'; event: MatchEventWithPlayers }
  | { kind: 'divider'; label: string; variant?: 'start' | 'added' | 'final' };

const STATUS_ORDER: MatchStatus[] = [
  'first_half', 'halftime', 'second_half',
  'extra_time_first', 'extra_time_break', 'extra_time_second',
  'penalties', 'finished',
];

function atOrPast(status: MatchStatus | undefined, target: MatchStatus): boolean {
  if (!status) return false;
  return STATUS_ORDER.indexOf(status) >= STATUS_ORDER.indexOf(target);
}

function buildTimeline(
  events: MatchEventWithPlayers[],
  status?: MatchStatus,
  firstHalfAddedTime = 0,
  secondHalfAddedTime = 0,
): TimelineItem[] {
  if (!status || !atOrPast(status, 'first_half')) return [];

  const items: TimelineItem[] = [];

  // Inicio del partido
  items.push({ kind: 'divider', label: 'Inicio del partido', variant: 'start' });

  // First half events
  for (const evt of events.filter((e) => e.period === 'first_half')) {
    items.push({ kind: 'event', event: evt });
  }

  if (atOrPast(status, 'halftime')) {
    // Added time 1T
    if (firstHalfAddedTime > 0) {
      items.push({ kind: 'divider', label: `+${firstHalfAddedTime}'`, variant: 'added' });
    }
    // ET (Entretiempo)
    items.push({ kind: 'divider', label: 'ET' });
  }

  if (atOrPast(status, 'second_half')) {
    // Inicio del 2° tiempo
    items.push({ kind: 'divider', label: 'Inicio del 2° tiempo', variant: 'start' });

    // Second half events
    for (const evt of events.filter((e) => e.period === 'second_half')) {
      items.push({ kind: 'event', event: evt });
    }

    // Extra time (if any, rare but supported)
    const extraEvents = events.filter(
      (e) => e.period === 'extra_time_first' || e.period === 'extra_time_second',
    );
    if (extraEvents.length > 0) {
      items.push({ kind: 'divider', label: 'Prórroga' });
      for (const evt of extraEvents) items.push({ kind: 'event', event: evt });
    }

    // Added time 2T — shows once match has ended regulation or gone to penalties
    const secondHalfEnded =
      STATUS_ORDER.indexOf(status) > STATUS_ORDER.indexOf('second_half');
    if (secondHalfEnded && secondHalfAddedTime > 0) {
      items.push({ kind: 'divider', label: `+${secondHalfAddedTime}'`, variant: 'added' });
    }

    // Penalty phase
    const penaltyEvents = events.filter((e) => e.period === 'penalties');
    const showPenalties = status === 'penalties' || penaltyEvents.length > 0;
    if (showPenalties) {
      items.push({ kind: 'divider', label: 'Penales' });
      for (const evt of penaltyEvents) items.push({ kind: 'event', event: evt });
    }

    // Fin del partido
    if (status === 'finished') {
      items.push({ kind: 'divider', label: 'Fin del partido', variant: 'final' });
    }
  }

  return items;
}

function EventIcon({ type }: { type: string }) {
  if (GOAL_TYPES.includes(type as never)) return <span title="Gol">⚽</span>;
  if (type === 'yellow_card') return <span title="Amarilla" className="text-yellow-500">🟨</span>;
  if (type === 'second_yellow' || type === 'red_card') return <span title="Roja" className="text-red-500">🟥</span>;
  if (type === 'substitution') return <span title="Cambio">🔄</span>;
  if (type === 'penalty_missed') return <span title="Penal fallado">✖️</span>;
  if (type === 'var_review') return <span title="VAR">📺</span>;
  return null;
}

function PeriodDivider({ label, variant }: { label: string; variant?: 'start' | 'added' | 'final' }) {
  const isStart = variant === 'start';
  const isAdded = variant === 'added';
  const isFinal = variant === 'final';

  const labelClass = isFinal
    ? 'text-secondary'
    : isAdded
    ? 'text-secondary'
    : isStart
    ? 'text-green-600 dark:text-green-400'
    : 'text-accent';

  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <div className="h-px flex-1 bg-border" />
      <span className={`text-[10px] font-bold uppercase tracking-widest ${labelClass}`}>
        {isFinal ? '🏁 ' : ''}{label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

export function MatchTimeline({
  events,
  homeClubId,
  status,
  firstHalfAddedTime = 0,
  secondHalfAddedTime = 0,
}: MatchTimelineProps) {
  const items = buildTimeline(events, status, firstHalfAddedTime, secondHalfAddedTime);

  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-secondary">El partido no ha comenzado</p>;
  }

  return (
    <div className="space-y-1 py-2">
      {items.map((item, i) => {
        if (item.kind === 'divider') {
          return <PeriodDivider key={`divider-${i}`} label={item.label} variant={item.variant} />;
        }

        const event = item.event;
        const isHome = event.club_id === homeClubId;

        return (
          <div
            key={event.id}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
              isHome ? 'flex-row' : 'flex-row-reverse'
            }`}
          >
            <span className="w-12 text-center text-xs font-bold text-secondary">
              {getEventMinuteLabel(event)}
            </span>

            <EventIcon type={event.type} />

            <div className={`flex flex-col ${isHome ? 'items-start' : 'items-end'}`}>
              <span className="text-sm font-medium text-primary">
                {event.player
                  ? formatPlayerShort(event.player.first_name, event.player.last_name)
                  : EVENT_TYPE_LABELS[event.type]}
              </span>
              {event.type === 'substitution' && event.secondary_player && (
                <span className="text-xs text-secondary">
                  ↑ {formatPlayerShort(event.secondary_player.first_name, event.secondary_player.last_name)}
                </span>
              )}
              {!GOAL_TYPES.includes(event.type as never) && !CARD_TYPES.includes(event.type as never) && event.type !== 'substitution' && (
                <span className="text-xs text-secondary">{EVENT_TYPE_LABELS[event.type]}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
