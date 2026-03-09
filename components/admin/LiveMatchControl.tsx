'use client';

import { useState } from 'react';
import { useRealtimeMatch } from '@/hooks/useRealtimeMatch';
import { useRealtimeEvents } from '@/hooks/useRealtimeEvents';
import { EventForm } from '@/components/admin/EventForm';
import { LineupForm } from '@/components/admin/LineupForm';
import { LiveClock } from '@/components/match/LiveClock';
import { deleteMatchEvent } from '@/lib/actions/events';
import { updateMatchStatus } from '@/lib/actions/matches';
import type { MatchDetail, Club, Player, MatchStatus, CoachingStaff } from '@/types';
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
  suspendedPlayerIds?: string[];
  homeCoachingStaff?: CoachingStaff[];
  awayCoachingStaff?: CoachingStaff[];
  homeExistingStaffIds?: string[];
  awayExistingStaffIds?: string[];
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
  { from: ['penalties'],                            to: 'finished',          label: '⏹ Finalizar',          color: 'red' },
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

export function LiveMatchControl({ initialMatch, clubs, players, role, userClubId, suspendedPlayerIds = [], homeCoachingStaff = [], awayCoachingStaff = [], homeExistingStaffIds = [], awayExistingStaffIds = [] }: LiveMatchControlProps) {
  const match = useRealtimeMatch(initialMatch);
  const events = useRealtimeEvents(initialMatch.id, initialMatch.events);
  const [transitioning, setTransitioning] = useState<string | null>(null);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'event' | 'lineup' | 'timeline'>('lineup');
  const [addedTime1, setAddedTime1] = useState('');   // tiempo adicional 1T
  const [addedTime2, setAddedTime2] = useState('');   // tiempo adicional 2T

  const isSuperAdmin = role === 'admin';
  const live = isLive(match.status);

  async function handleDelete(eventId: string) {
    await deleteMatchEvent(eventId, initialMatch.id);
  }

  async function handleTransition(to: MatchStatus) {
    setTransitioning(to);
    setTransitionError(null);
    const extra: { first_half_added_time?: number; second_half_added_time?: number } = {};
    if (to === 'halftime' && addedTime1) extra.first_half_added_time = parseInt(addedTime1);
    if ((to === 'finished' || to === 'extra_time_first') && addedTime2) extra.second_half_added_time = parseInt(addedTime2);
    const result = await updateMatchStatus(match.id, to, Object.keys(extra).length ? extra : undefined);
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

      {/* Control de estado — admin y team admin */}
      {available.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          {transitionError && (
            <p className="text-sm text-red-600">{transitionError}</p>
          )}

          {/* Input tiempo adicional 1T — solo cuando el partido está en primer tiempo */}
          {match.status === 'first_half' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">+ min 1T</label>
              <input
                type="number"
                min="0" max="20"
                value={addedTime1}
                onChange={(e) => setAddedTime1(e.target.value)}
                placeholder="0"
                className="w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-center text-sm focus:border-yellow-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400">minutos adicionales al finalizar el tiempo</span>
            </div>
          )}

          {/* Input tiempo adicional 2T — cuando está en segundo tiempo */}
          {match.status === 'second_half' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">+ min 2T</label>
              <input
                type="number"
                min="0" max="20"
                value={addedTime2}
                onChange={(e) => setAddedTime2(e.target.value)}
                placeholder="0"
                className="w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-center text-sm focus:border-yellow-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400">minutos adicionales al finalizar el tiempo</span>
            </div>
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

      {/* Panel de penales */}
      {(match.status === 'penalties' || events.some((e) => e.period === 'penalties')) && (
        <PenaltyBoard
          events={events}
          homeClub={initialMatch.home_club}
          awayClub={initialMatch.away_club}
        />
      )}

      {/* Opción penales — cruce eliminatorio empatado, sin penales registrados aún */}
      {match.status === 'finished' &&
        initialMatch.tournament.format === 'eliminatorias' &&
        match.home_score === match.away_score &&
        !events.some((e) => e.period === 'penalties') && (
          <TieCrucesPanel
            homeClub={initialMatch.home_club}
            awayClub={initialMatch.away_club}
            homeScore={match.home_score}
            awayScore={match.away_score}
            onGoToPenalties={() => handleTransition('penalties')}
            transitioning={transitioning !== null}
          />
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
          onClick={() => setActiveTab('lineup')}
          className={`flex-1 py-3 text-xs font-semibold transition-colors ${
            activeTab === 'lineup' ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          👕 Alineación
        </button>
        <button
          onClick={() => setActiveTab('event')}
          className={`flex-1 py-3 text-xs font-semibold transition-colors ${
            activeTab === 'event' ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          ⚽ Evento
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-3 text-xs font-semibold transition-colors ${
            activeTab === 'timeline' ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          📋 Timeline ({events.length})
        </button>
      </div>

      {/* Panel activo */}
      {activeTab === 'lineup' && (
        <div className="space-y-6">
          {(() => {
            const clubsToShow = lockedClubId
              ? clubs.filter((c) => c.id === lockedClubId)
              : clubs;
            return clubsToShow.map((club) => {
              const clubPlayers = players.filter((p) => p.club_id === club.id);
              const existingLineup = [
                ...initialMatch.home_starters,
                ...initialMatch.home_subs,
                ...initialMatch.away_starters,
                ...initialMatch.away_subs,
              ].filter((l) => l.club_id === club.id);
              const isHome = club.id === initialMatch.home_club_id;
              const clubStaff = isHome ? homeCoachingStaff : awayCoachingStaff;
              const clubStaffIds = isHome ? homeExistingStaffIds : awayExistingStaffIds;
              return (
                <div key={club.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <LineupForm
                    matchId={match.id}
                    clubId={club.id}
                    clubName={club.name}
                    players={clubPlayers}
                    existingLineup={existingLineup}
                    suspendedPlayerIds={suspendedPlayerIds}
                    coachingStaff={clubStaff}
                    existingStaffIds={clubStaffIds}
                  />
                </div>
              );
            });
          })()}
        </div>
      )}

      {activeTab === 'event' && (
        match.status === 'scheduled' ? (
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
      )}

      {activeTab === 'timeline' && (
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

function TieCrucesPanel({ homeClub, awayClub, homeScore, awayScore, onGoToPenalties, transitioning }: {
  homeClub: Club;
  awayClub: Club;
  homeScore: number;
  awayScore: number;
  onGoToPenalties: () => void;
  transitioning: boolean;
}) {
  return (
    <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚖️</span>
        <div>
          <p className="text-sm font-bold text-amber-900">Empate en cruce eliminatorio</p>
          <p className="text-xs text-amber-700">
            {homeClub.short_name ?? homeClub.name} {homeScore} – {awayScore} {awayClub.short_name ?? awayClub.name}
          </p>
        </div>
      </div>
      <p className="text-xs text-amber-700">
        ¿El ganador se define por tanda de penales?
      </p>
      <button
        onClick={onGoToPenalties}
        disabled={transitioning}
        className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {transitioning ? 'Cargando...' : '🎯 Ir a tanda de penales'}
      </button>
    </div>
  );
}

function PenaltyBoard({ events, homeClub, awayClub }: {
  events: MatchDetail['events'];
  homeClub: Club;
  awayClub: Club;
}) {
  const penaltyEvents = events.filter((e) => e.period === 'penalties');
  const homeKicks = penaltyEvents.filter((e) => e.club_id === homeClub.id);
  const awayKicks = penaltyEvents.filter((e) => e.club_id === awayClub.id);
  const homeScore = homeKicks.filter((e) => e.type === 'goal' || e.type === 'penalty_goal').length;
  const awayScore = awayKicks.filter((e) => e.type === 'goal' || e.type === 'penalty_goal').length;
  const maxKicks = Math.max(homeKicks.length, awayKicks.length);

  return (
    <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4">
      <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-widest text-blue-400">Penales</p>

      {/* Marcador penales */}
      <div className="mb-4 flex items-center justify-center gap-4">
        <span className="text-sm font-bold text-slate-700">{homeClub.short_name ?? homeClub.name}</span>
        <span className="text-3xl font-black text-slate-900 tabular-nums">{homeScore} – {awayScore}</span>
        <span className="text-sm font-bold text-slate-700">{awayClub.short_name ?? awayClub.name}</span>
      </div>

      {/* Kicks */}
      {maxKicks > 0 && (
        <div className="grid grid-cols-2 gap-x-3">
          {/* Home */}
          <div className="space-y-1">
            {homeKicks.map((e, i) => {
              const ok = e.type === 'goal' || e.type === 'penalty_goal';
              return (
                <div key={e.id} className="flex items-center gap-2">
                  <span className={`text-base leading-none ${ok ? 'text-green-600' : 'text-red-500'}`}>
                    {ok ? '⚽' : '✗'}
                  </span>
                  <span className="truncate text-sm text-slate-700">
                    {e.player ? e.player.last_name : `Tiro ${i + 1}`}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Away */}
          <div className="space-y-1">
            {awayKicks.map((e, i) => {
              const ok = e.type === 'goal' || e.type === 'penalty_goal';
              return (
                <div key={e.id} className="flex items-center justify-end gap-2">
                  <span className="truncate text-sm text-slate-700">
                    {e.player ? e.player.last_name : `Tiro ${i + 1}`}
                  </span>
                  <span className={`text-base leading-none ${ok ? 'text-green-600' : 'text-red-500'}`}>
                    {ok ? '⚽' : '✗'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
