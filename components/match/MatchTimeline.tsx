import type { MatchEventWithPlayers } from '@/types';
import { EVENT_TYPE_LABELS, GOAL_TYPES, CARD_TYPES } from '@/types';
import { getEventMinuteLabel } from '@/types';
import { formatPlayerShort } from '@/lib/utils/format';

interface MatchTimelineProps {
  events: MatchEventWithPlayers[];
  homeClubId: string;
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

export function MatchTimeline({ events, homeClubId }: MatchTimelineProps) {
  if (events.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">Sin eventos registrados</p>;
  }

  return (
    <div className="space-y-1 py-2">
      {events.map((event) => {
        const isHome = event.club_id === homeClubId;
        return (
          <div
            key={event.id}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
              isHome ? 'flex-row' : 'flex-row-reverse'
            }`}
          >
            {/* Minuto centrado */}
            <span className="w-12 text-center text-xs font-bold text-slate-500">
              {getEventMinuteLabel(event)}
            </span>

            {/* Ícono */}
            <EventIcon type={event.type} />

            {/* Info */}
            <div className={`flex flex-col ${isHome ? 'items-start' : 'items-end'}`}>
              <span className="text-sm font-medium">
                {event.player
                  ? formatPlayerShort(event.player.first_name, event.player.last_name)
                  : EVENT_TYPE_LABELS[event.type]}
              </span>
              {event.type === 'substitution' && event.secondary_player && (
                <span className="text-xs text-slate-400">
                  ↑ {formatPlayerShort(event.secondary_player.first_name, event.secondary_player.last_name)}
                </span>
              )}
              {!GOAL_TYPES.includes(event.type as never) && !CARD_TYPES.includes(event.type as never) && event.type !== 'substitution' && (
                <span className="text-xs text-slate-400">{EVENT_TYPE_LABELS[event.type]}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
