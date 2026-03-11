'use client';

import { useState, useTransition } from 'react';
import { deleteMatchEvent } from '@/lib/actions/events';
import { EventForm } from '@/components/admin/EventForm';
import type { Match, Club, Player } from '@/types';
import { GOAL_TYPES } from '@/types';

interface MatchEvent {
  id: string;
  type: string;
  minute: number;
  added_time: number;
  period: string;
  club_id: string;
  player?: { first_name: string; last_name: string } | null;
  secondary_player?: { first_name: string; last_name: string } | null;
}

interface Props {
  match: Match & { events: MatchEvent[] };
  clubs: Club[];
  players: Player[];
}

const EVENT_LABELS: Record<string, { label: string; emoji: string }> = {
  goal:          { label: 'Gol',           emoji: '⚽' },
  penalty_goal:  { label: 'Gol de penal',  emoji: '🎯' },
  own_goal:      { label: 'Gol en contra', emoji: '⚽' },
  penalty_missed:{ label: 'Penal fallado', emoji: '✖️' },
  yellow_card:   { label: 'Amarilla',      emoji: '🟨' },
  red_card:      { label: 'Roja',          emoji: '🟥' },
  second_yellow: { label: 'Doble amarilla',emoji: '🟨🟥' },
  substitution:  { label: 'Cambio',        emoji: '🔄' },
};

const RELEVANT_TYPES = new Set([
  'goal', 'penalty_goal', 'own_goal', 'penalty_missed',
  'yellow_card', 'red_card', 'second_yellow',
]);

function minuteLabel(minute: number, addedTime: number) {
  return addedTime > 0 ? `${minute}+${addedTime}'` : `${minute}'`;
}

function DeleteButton({ eventId, matchId }: { eventId: string; matchId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => { deleteMatchEvent(eventId, matchId); })}
      className="ml-auto text-slate-400 hover:text-red-500 disabled:opacity-40 transition-colors text-xs px-2"
    >
      {pending ? '...' : '✕'}
    </button>
  );
}

export function MatchEventsPanel({ match, clubs, players }: Props) {
  const [showForm, setShowForm] = useState(false);

  const relevantEvents = (match.events ?? [])
    .filter((e) => RELEVANT_TYPES.has(e.type))
    .sort((a, b) => a.minute - b.minute || a.added_time - b.added_time);

  return (
    <div className="space-y-4">
      {/* Existing events */}
      {relevantEvents.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Eventos registrados</h3>
          <ul className="divide-y divide-slate-100">
            {relevantEvents.map((e) => {
              const meta = EVENT_LABELS[e.type] ?? { label: e.type, emoji: '' };
              const club = clubs.find((c) => c.id === e.club_id);
              const playerName = e.player
                ? `${e.player.last_name}, ${e.player.first_name}`
                : '—';
              return (
                <li key={e.id} className="flex items-center gap-2 py-2 text-sm">
                  <span className="w-10 text-right font-mono text-slate-400 text-xs">
                    {minuteLabel(e.minute, e.added_time)}
                  </span>
                  <span className="text-base">{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-slate-800">{playerName}</span>
                    <span className="mx-1 text-slate-400">·</span>
                    <span className="text-slate-500">{club?.short_name ?? club?.name ?? '?'}</span>
                  </div>
                  <DeleteButton eventId={e.id} matchId={match.id} />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Toggle form */}
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors"
        >
          + Agregar evento (gol / tarjeta)
        </button>
      ) : (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Agregar evento</span>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancelar
            </button>
          </div>
          <EventForm match={match as any} clubs={clubs} players={players} />
        </div>
      )}
    </div>
  );
}
