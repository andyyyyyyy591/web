'use client';

import { useState } from 'react';
import { addMatchEvent } from '@/lib/actions/events';
import type { Match, Club, Player, MatchPeriod, EventType } from '@/types';

interface EventFormProps {
  match: Match;
  clubs: Club[];
  players: Player[];
  /** Si se pasa, el team admin solo puede cargar eventos de ese club */
  lockedClubId?: string;
}

// Tipos de evento agrupados (para UI de botones grandes)
const EVENT_BUTTONS = [
  { type: 'goal' as EventType,        label: 'Gol',       emoji: '⚽', color: 'green' },
  { type: 'yellow_card' as EventType, label: 'Amarilla',  emoji: '🟨', color: 'yellow' },
  { type: 'red_card' as EventType,    label: 'Roja',      emoji: '🟥', color: 'red' },
  { type: 'substitution' as EventType,label: 'Cambio',    emoji: '🔄', color: 'blue' },
  { type: 'penalty_missed' as EventType, label: 'Penal fallado', emoji: '✖️', color: 'orange' },
  { type: 'second_yellow' as EventType, label: 'Doble amarilla', emoji: '🟨🟥', color: 'red' },
] as const;

// Sub-tipos de gol
const GOAL_SUBTYPES = [
  { value: '',          label: 'Normal' },
  { value: 'cabeza',    label: 'De cabeza' },
  { value: 'tiro_libre',label: 'Tiro libre' },
  { value: 'en_contra', label: 'Gol en contra' },
] as const;

const PERIOD_OPTIONS: { value: MatchPeriod; label: string }[] = [
  { value: 'first_half',        label: '1° Tiempo' },
  { value: 'second_half',       label: '2° Tiempo' },
  { value: 'extra_time_first',  label: 'T.E. 1°' },
  { value: 'extra_time_second', label: 'T.E. 2°' },
  { value: 'penalties',         label: 'Penales' },
];

function colorClasses(color: string, selected: boolean) {
  const base = 'rounded-xl border-2 p-3 text-center transition-all flex flex-col items-center gap-1 active:scale-95';
  const map: Record<string, string> = {
    green:  selected ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 bg-white text-slate-600 hover:border-green-300',
    yellow: selected ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-slate-200 bg-white text-slate-600 hover:border-yellow-300',
    red:    selected ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-600 hover:border-red-300',
    blue:   selected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300',
    orange: selected ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 bg-white text-slate-600 hover:border-orange-300',
  };
  return `${base} ${map[color] ?? map.green}`;
}

export function EventForm({ match, clubs, players, lockedClubId }: EventFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'type' | 'details'>('type');

  const [type, setType] = useState<EventType>('goal');
  const [goalSubtype, setGoalSubtype] = useState('');
  const [minute, setMinute] = useState('');
  const [addedTime, setAddedTime] = useState('0');
  const [period, setPeriod] = useState<MatchPeriod>('first_half');
  const [clubId, setClubId] = useState(lockedClubId ?? match.home_club_id);
  const [playerId, setPlayerId] = useState('');
  const [secondaryPlayerId, setSecondaryPlayerId] = useState('');

  const filteredPlayers = players
    .filter((p) => p.club_id === clubId)
    .sort((a, b) => a.last_name.localeCompare(b.last_name));

  function selectType(t: EventType) {
    setType(t);
    // For en_contra, switch to the rival club
    if (t === 'goal') setGoalSubtype('');
    setPlayerId('');
    setSecondaryPlayerId('');
    setStep('details');
  }

  function reset() {
    setStep('type');
    setType('goal');
    setGoalSubtype('');
    setMinute('');
    setAddedTime('0');
    setPlayerId('');
    setSecondaryPlayerId('');
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!minute) return;
    setLoading(true);
    setError(null);

    // For own goal via subtype, change the actual type
    let actualType: EventType = type;
    let description: string | undefined = undefined;
    if (type === 'goal') {
      if (goalSubtype === 'en_contra') {
        actualType = 'own_goal';
      } else if (goalSubtype) {
        description = goalSubtype;
      }
    }

    const result = await addMatchEvent({
      match_id: match.id,
      minute: parseInt(minute),
      added_time: parseInt(addedTime) || 0,
      period,
      type: actualType,
      club_id: clubId,
      player_id: playerId || undefined,
      secondary_player_id: secondaryPlayerId || undefined,
      description,
    });

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => { setSuccess(false); reset(); }, 1500);
    }
  }

  // ── Step 1: selección de tipo ──
  if (step === 'type') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="mb-4 font-semibold text-slate-800">¿Qué ocurrió?</h3>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
          {EVENT_BUTTONS.map((btn) => (
            <button
              key={btn.type}
              type="button"
              onClick={() => selectType(btn.type)}
              className={colorClasses(btn.color, false)}
            >
              <span className="text-2xl">{btn.emoji}</span>
              <span className="text-xs font-semibold">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Step 2: detalles ──
  const selectedBtn = EVENT_BUTTONS.find((b) => b.type === type);
  const isGoal = type === 'goal';
  const isSub = type === 'substitution';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{selectedBtn?.emoji}</span>
          <span className="font-semibold text-slate-800">{selectedBtn?.label}</span>
        </div>
        <button type="button" onClick={reset} className="text-sm text-slate-400 hover:text-slate-600">
          ← Cambiar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}
        {success && (
          <div className="rounded-lg bg-green-50 p-3 text-center text-sm font-semibold text-green-700">
            ✓ Evento registrado
          </div>
        )}

        {/* Sub-tipo de gol */}
        {isGoal && (
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo de gol</label>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_SUBTYPES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setGoalSubtype(s.value)}
                  className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    goalSubtype === s.value
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Club (solo si no está bloqueado) */}
        {!lockedClubId && clubs.length > 1 && (
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Equipo</label>
            <div className="flex gap-2">
              {clubs.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { setClubId(c.id); setPlayerId(''); setSecondaryPlayerId(''); }}
                  className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors ${
                    clubId === c.id
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {c.short_name ?? c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Jugador principal */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            {isSub ? 'Jugador que sale' : 'Jugador'}
          </label>
          <select
            className="w-full rounded-xl border-2 border-slate-200 px-3 py-3 text-sm focus:border-green-400 focus:outline-none"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
          >
            <option value="">— Sin especificar —</option>
            {filteredPlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.last_name}, {p.first_name}
              </option>
            ))}
          </select>
        </div>

        {/* Jugador secundario (cambio) */}
        {isSub && (
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Jugador que entra</label>
            <select
              className="w-full rounded-xl border-2 border-slate-200 px-3 py-3 text-sm focus:border-green-400 focus:outline-none"
              value={secondaryPlayerId}
              onChange={(e) => setSecondaryPlayerId(e.target.value)}
            >
              <option value="">— Sin especificar —</option>
              {filteredPlayers.filter((p) => p.id !== playerId).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.last_name}, {p.first_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Período + Minuto */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Período</label>
            <select
              className="w-full rounded-xl border-2 border-slate-200 px-3 py-3 text-sm focus:border-green-400 focus:outline-none"
              value={period}
              onChange={(e) => setPeriod(e.target.value as MatchPeriod)}
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Minuto</label>
            <div className="flex gap-1">
              <input
                type="number"
                min="1"
                max="120"
                required
                placeholder="45"
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-200 px-3 py-3 text-center text-sm font-bold focus:border-green-400 focus:outline-none"
              />
              <div className="flex items-center text-xs text-slate-400 px-1">+</div>
              <input
                type="number"
                min="0"
                max="20"
                value={addedTime}
                onChange={(e) => setAddedTime(e.target.value)}
                className="w-14 rounded-xl border-2 border-slate-200 px-2 py-3 text-center text-sm focus:border-green-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full rounded-xl bg-green-600 py-3.5 text-base font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50 active:scale-95"
        >
          {loading ? 'Guardando...' : success ? '✓ Guardado' : 'Confirmar evento'}
        </button>
      </form>
    </div>
  );
}
