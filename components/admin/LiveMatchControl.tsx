'use client';

import { useState } from 'react';
import { useRealtimeMatch } from '@/hooks/useRealtimeMatch';
import { useRealtimeEvents } from '@/hooks/useRealtimeEvents';
import { EventForm } from '@/components/admin/EventForm';
import { MatchTimeline } from '@/components/match/MatchTimeline';
import { LiveClock } from '@/components/match/LiveClock';
import { deleteMatchEvent } from '@/lib/actions/events';
import { updateMatchStatus } from '@/lib/actions/matches';
import type { MatchDetail, Club, Player, MatchStatus } from '@/types';
import { STATUS_LABELS, isLive } from '@/types';
import type { AdminRole } from '@/types';
import Image from 'next/image';

interface LiveMatchControlProps {
  initialMatch: MatchDetail;
  clubs: Club[];
  players: Player[];
  role: AdminRole | null;
  /** Club del team admin (si aplica) */
  userClubId?: string | null;
}

// Transiciones de estado
const TRANSITIONS: Array<{
  from: MatchStatus[];
  to: MatchStatus;
  label: string;
  color: string;
}> = [
  { from: ['scheduled'],                            to: 'first_half',        label: '▶ Iniciar partido',    color: 'green' },
  { from: ['first_half'],                           to: 'halftime',          label: '⏸ Medio tiempo',       color: 'yellow' },
  { from: ['halftime'],                             to: 'second_half',       label: '▶ 2° Tiempo',          color: 'green' },
  { from: ['second_half'],                          to: 'extra_time_first',  label: '⏱ Tiempo extra',       color: 'yellow' },
  { from: ['second_half', 'extra_time_second'],     to: 'finished',          label: '⏹ Finalizar',          color: 'red' },
  { from: ['extra_time_first'],                     to: 'extra_time_break',  label: '⏸ Descanso T.E.',     color: 'yellow' },
  { from: ['extra_time_break'],                     to: 'extra_time_second', label: '▶ T.E. 2°',           color: 'green' },
  { from: ['extra_time_second'],                    to: 'penalties',         label: '🎯 Penales',           color: 'blue' },
];

function btnColor(color: string) {
  const map: Record<string, string> = {
    green:  'bg-green-600 hover:bg-green-700 text-white',
    yellow: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    red:    'bg-red-600 hover:bg-red-700 text-white',
    blue:   'bg-blue-600 hover:bg-blue-700 text-white',
  };
  return map[color] ?? map.green;
}

export function LiveMatchControl({ initialMatch, clubs, players, role, userClubId }: LiveMatchControlProps) {
  const match = useRealtimeMatch(initialMatch);
  const events = useRealtimeEvents(initialMatch.id, initialMatch.events);
  const [transitioning, setTransitioning] = useState<string | null>(null);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'event' | 'timeline'>('event');

  const isSuperAdmin = role === 'admin';
  const live = isLive(match.status);

  async function handleDelete(eventId: string) {
    await deleteMatchEvent(eventId, initialMatch.id);
  }

  async function handleTransition(to: MatchStatus) {
    setTransitioning(to);
    setTransitionError(null);
    const result = await updateMatchStatus(match.id, to);
    if (result.error) setTransitionError(result.error);
    setTransitioning(null);
  }

  const available = TRANSITIONS.filter((t) => t.from.includes(match.status));

  // Para team admin: solo pueden ver su equipo, pero pueden ver la timeline completa
  const lockedClubId = !isSuperAdmin && userClubId ? userClubId : undefined;
  const teamAdminClub = lockedClubId ? clubs.find((c) => c.id === lockedClubId) : null;

  return (
    <div className="space-y-4">
      {/* Marcador */}
      <div className="rounded-2xl bg-slate-900 p-5 text-white">
        <div className="mb-2 flex items-center justify-center gap-2 text-sm">
          {live && <span className="live-dot" />}
          <span className={live ? 'text-red-400 font-semibold' : 'text-slate-400'}>
            {STATUS_LABELS[match.status]}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 flex-col items-center gap-1.5">
            {initialMatch.home_club.logo_url && (
              <Image src={initialMatch.home_club.logo_url} alt={initialMatch.home_club.name}
                width={40} height={40} className="h-10 w-10 object-contain" />
            )}
            <span className="text-center text-sm font-semibold leading-tight">
              {initialMatch.home_club.short_name ?? initialMatch.home_club.name}
            </span>
          </div>
          <div className="text-center">
            <div className="text-5xl font-black tabular-nums">
              {match.home_score} — {match.away_score}
            </div>
            <LiveClock match={match} />
          </div>
          <div className="flex flex-1 flex-col items-center gap-1.5">
            {initialMatch.away_club.logo_url && (
              <Image src={initialMatch.away_club.logo_url} alt={initialMatch.away_club.name}
                width={40} height={40} className="h-10 w-10 object-contain" />
            )}
            <span className="text-center text-sm font-semibold leading-tight">
              {initialMatch.away_club.short_name ?? initialMatch.away_club.name}
            </span>
          </div>
        </div>
      </div>

      {/* Control de estado — solo super admin */}
      {isSuperAdmin && available.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          {transitionError && (
            <p className="mb-3 text-sm text-red-600">{transitionError}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {available.map((t) => (
              <button
                key={t.to}
                onClick={() => handleTransition(t.to)}
                disabled={transitioning !== null}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 ${btnColor(t.color)}`}
              >
                {transitioning === t.to ? 'Cargando...' : t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Aviso team admin */}
      {!isSuperAdmin && teamAdminClub && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
          Registrando eventos para: <strong>{teamAdminClub.name}</strong>
        </div>
      )}

      {/* Tabs */}
      <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden">
        <button
          onClick={() => setActiveTab('event')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'event' ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          ⚽ Cargar evento
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'timeline' ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          📋 Timeline ({events.length})
        </button>
      </div>

      {/* Panel activo */}
      {activeTab === 'event' ? (
        (match.status === 'scheduled' && !isSuperAdmin) ? (
          <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-400">
            El partido aún no ha comenzado
          </div>
        ) : (
          <EventForm
            match={match}
            clubs={clubs}
            players={players}
            lockedClubId={lockedClubId}
          />
        )
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Sin eventos registrados</p>
            ) : (
              <div className="space-y-1">
                {[...events].reverse().map((event) => (
                  <div key={event.id} className="flex items-center gap-2 rounded-xl p-2.5 hover:bg-slate-50">
                    <span className="w-10 text-xs font-bold text-slate-400">
                      {event.minute}{event.added_time > 0 ? `+${event.added_time}` : ''}&apos;
                    </span>
                    <span className="flex-1 text-sm">
                      {event.player
                        ? `${event.player.last_name} ${event.player.first_name}`
                        : event.type}
                      {event.description && <span className="ml-1 text-xs text-slate-400">({event.description})</span>}
                    </span>
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
