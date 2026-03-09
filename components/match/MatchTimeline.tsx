import type { MatchEventWithPlayers, MatchStatus } from '@/types';
import { EVENT_TYPE_LABELS, GOAL_TYPES, CARD_TYPES } from '@/types';
import { getEventMinuteLabel } from '@/types';
import { formatPlayerShort } from '@/lib/utils/format';

interface MatchTimelineProps {
  events: MatchEventWithPlayers[];
  homeClubId: string;
  status?: MatchStatus;
}

type TimelineItem =
  | { kind: 'event'; event: MatchEventWithPlayers }
  | { kind: 'divider'; label: string; variant?: 'final' };

function buildTimeline(events: MatchEventWithPlayers[], status?: MatchStatus): TimelineItem[] {
  const items: TimelineItem[] = [];
  let lastPeriod: string | null = null;

  for (const event of events) {
    const period = event.period;

    if (lastPeriod !== null && period !== lastPeriod) {
      if (period === 'second_half' && lastPeriod === 'first_half') {
        items.push({ kind: 'divider', label: 'ET' });
      } else if (period === 'penalties') {
        items.push({ kind: 'divider', label: 'Penales' });
      }
    }
    lastPeriod = period;
    items.push({ kind: 'event', event });
  }

  if (status === 'finished') {
    items.push({ kind: 'divider', label: 'Fin del partido', variant: 'final' });
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

function PeriodDivider({ label, variant }: { label: string; variant?: 'final' }) {
  const isFinal = variant === 'final';
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <div className={`h-px flex-1 ${isFinal ? 'bg-border' : 'bg-border'}`} />
      <span className={`text-[10px] font-bold uppercase tracking-widest ${isFinal ? 'text-secondary' : 'text-accent'}`}>
        {isFinal ? '🏁 ' : ''}{label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

export function MatchTimeline({ events, homeClubId, status }: MatchTimelineProps) {
  if (events.length === 0) {
    return <p className="py-8 text-center text-sm text-secondary">Sin eventos registrados</p>;
  }

  const items = buildTimeline(events, status);

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
