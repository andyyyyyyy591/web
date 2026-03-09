'use client';

import { useState } from 'react';
import { saveLineup, type LineupEntry } from '@/lib/actions/lineups';
import { saveMatchCoachingStaff } from '@/lib/actions/coaching-staff';
import type { Player, MatchLineupWithPlayer, CoachingStaff } from '@/types';

interface Props {
  matchId: string;
  clubId: string;
  clubName: string;
  players: Player[];
  existingLineup: MatchLineupWithPlayer[];
  suspendedPlayerIds?: string[];
  coachingStaff?: CoachingStaff[];
  existingStaffIds?: string[];
}

const POSITIONS = ['', 'ARQ', 'DFC', 'LD', 'LI', 'MCD', 'MC', 'MCO', 'MI', 'MD', 'EXT D', 'EXT I', 'SD', 'DC', 'DEL'];

const FORMATIONS: Record<string, string[]> = {
  '4-4-2':   ['ARQ', 'LD', 'DFC', 'DFC', 'LI', 'MD', 'MC', 'MC', 'MI', 'DC', 'DC'],
  '4-3-3':   ['ARQ', 'LD', 'DFC', 'DFC', 'LI', 'MD', 'MC', 'MI', 'EXT D', 'DC', 'EXT I'],
  '4-2-3-1': ['ARQ', 'LD', 'DFC', 'DFC', 'LI', 'MCD', 'MCD', 'MD', 'MCO', 'MI', 'SD'],
  '4-1-4-1': ['ARQ', 'LD', 'DFC', 'DFC', 'LI', 'MCD', 'MD', 'MC', 'MC', 'MI', 'SD'],
  '3-5-2':   ['ARQ', 'DFC', 'DFC', 'DFC', 'MD', 'MC', 'MCD', 'MC', 'MI', 'DC', 'DC'],
  '5-3-2':   ['ARQ', 'LD', 'DFC', 'DFC', 'DFC', 'LI', 'MD', 'MC', 'MI', 'DC', 'DC'],
};

const POSITION_ORDER: Record<string, number> = {
  ARQ: 0, POR: 0,
  DFC: 1, LD: 1, LI: 1,
  MCD: 2, MC: 2, MCO: 2, MI: 2, MD: 2, 'EXT D': 2, 'EXT I': 2,
  SD: 3, DC: 3, DEL: 3,
};

export function LineupForm({ matchId, clubId, clubName, players, existingLineup, suspendedPlayerIds = [], coachingStaff = [], existingStaffIds = [] }: Props) {
  type Entry = { selected: boolean; is_starter: boolean; shirt_number: string; position_label: string };

  const [entries, setEntries] = useState<Record<string, Entry>>(() => {
    const map: Record<string, Entry> = {};
    for (const p of players) {
      const existing = existingLineup.find((l) => l.player_id === p.id);
      map[p.id] = existing
        ? {
            selected: true,
            is_starter: existing.is_starter,
            shirt_number: existing.shirt_number?.toString() ?? p.jersey_number?.toString() ?? '',
            position_label: existing.position_label ?? '',
          }
        : {
            selected: false,
            is_starter: true,
            shirt_number: p.jersey_number?.toString() ?? '',
            position_label: '',
          };
    }
    return map;
  });

  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(() => new Set(existingStaffIds));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playerSearch, setPlayerSearch] = useState('');
  const [formation, setFormation] = useState('');

  function applyFormation(formationKey: string) {
    const positions = FORMATIONS[formationKey];
    if (!positions) return;
    const starterIds = players
      .filter((p) => entries[p.id]?.selected && entries[p.id]?.is_starter)
      .map((p) => p.id);
    setEntries((prev) => {
      const next = { ...prev };
      starterIds.forEach((id, i) => {
        if (positions[i]) next[id] = { ...next[id], position_label: positions[i] };
      });
      return next;
    });
  }

  function toggle(playerId: string) {
    setEntries((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], selected: !prev[playerId].selected },
    }));
  }

  function update(playerId: string, field: keyof Entry, value: string | boolean) {
    setEntries((prev) => ({ ...prev, [playerId]: { ...prev[playerId], [field]: value } }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);

    const lineupEntries: LineupEntry[] = players
      .filter((p) => entries[p.id]?.selected)
      .map((p) => ({
        player_id: p.id,
        is_starter: entries[p.id].is_starter,
        shirt_number: entries[p.id].shirt_number ? parseInt(entries[p.id].shirt_number) : null,
        position_label: entries[p.id].position_label || null,
      }));

    const [lineupResult] = await Promise.all([
      saveLineup(matchId, clubId, lineupEntries),
      coachingStaff.length > 0
        ? saveMatchCoachingStaff(matchId, clubId, Array.from(selectedStaff))
        : Promise.resolve({ success: true }),
    ]);
    setSaving(false);
    if (lineupResult.error) setError(lineupResult.error);
    else setMessage('Alineación guardada.');
  }

  const suspendedSet = new Set(suspendedPlayerIds);

  const starters = players
    .filter((p) => entries[p.id]?.selected && entries[p.id]?.is_starter)
    .sort((a, b) => {
      const oa = POSITION_ORDER[entries[a.id]?.position_label ?? ''] ?? 4;
      const ob = POSITION_ORDER[entries[b.id]?.position_label ?? ''] ?? 4;
      return oa - ob;
    });
  const subs = players.filter((p) => entries[p.id]?.selected && !entries[p.id]?.is_starter);
  const unselected = players.filter((p) => !entries[p.id]?.selected && !suspendedSet.has(p.id));
  const suspended = players.filter((p) => suspendedSet.has(p.id));

  const searchNorm = playerSearch.toLowerCase().trim();
  const filteredUnselected = searchNorm
    ? unselected.filter((p) => {
        const full = `${p.first_name} ${p.last_name} ${p.last_name} ${p.first_name}`.toLowerCase();
        const num = p.jersey_number?.toString() ?? '';
        return full.includes(searchNorm) || num.startsWith(searchNorm);
      })
    : unselected;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">{clubName}</h3>
        <div className="text-xs text-slate-500">
          {starters.length} tit · {subs.length} sup
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {message && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}

      {/* Formación */}
      {starters.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Formación</label>
          <select
            value={formation}
            onChange={(e) => {
              setFormation(e.target.value);
              applyFormation(e.target.value);
            }}
            className="rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:border-green-500"
          >
            <option value="">— Seleccionar —</option>
            {Object.keys(FORMATIONS).map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          {formation && (
            <span className="text-xs text-slate-400">(posiciones asignadas automáticamente)</span>
          )}
        </div>
      )}

      {/* Titulares */}
      {starters.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Titulares ({starters.length})</p>
          <div className="space-y-2">
            {starters.map((p) => (
              <PlayerRow key={p.id} player={p} entry={entries[p.id]} onToggle={toggle} onUpdate={update} />
            ))}
          </div>
        </div>
      )}

      {/* Suplentes */}
      {subs.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Suplentes</p>
          <div className="space-y-2">
            {subs.map((p) => (
              <PlayerRow key={p.id} player={p} entry={entries[p.id]} onToggle={toggle} onUpdate={update} />
            ))}
          </div>
        </div>
      )}

      {/* Sin seleccionar */}
      {unselected.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            Jugadores disponibles ({unselected.length})
          </p>

          {/* Buscador */}
          <div className="relative mb-2">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              placeholder="Buscar jugador por nombre o número…"
              className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            {playerSearch && (
              <button
                onClick={() => setPlayerSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="space-y-1">
            {filteredUnselected.length === 0 ? (
              <p className="py-3 text-center text-xs text-slate-400">
                Sin resultados para "{playerSearch}"
              </p>
            ) : (
              filteredUnselected.map((p) => (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className="flex w-full items-center gap-3 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-left text-sm text-slate-500 hover:border-green-400 hover:text-slate-800 transition-colors"
                >
                  <span className="w-6 text-right text-xs text-slate-400">{p.jersey_number ?? '—'}</span>
                  <span className="flex-1">{p.last_name} {p.first_name}</span>
                  <span className="text-xs text-green-600 font-semibold">+ Agregar</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Cuerpo técnico */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
          Cuerpo técnico
        </p>
        {coachingStaff.length === 0 ? (
          <a
            href="/admin/cuerpo-tecnico"
            className="block rounded-lg border border-dashed border-slate-200 px-3 py-3 text-center text-xs text-slate-400 hover:border-green-300 hover:text-green-600 transition-colors"
          >
            Sin cuerpo técnico registrado — hacé clic aquí para agregar
          </a>
        ) : (
          <div className="space-y-1">
            {coachingStaff.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedStaff((prev) => {
                  const next = new Set(prev);
                  if (next.has(s.id)) next.delete(s.id);
                  else next.add(s.id);
                  return next;
                })}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  selectedStaff.has(s.id)
                    ? 'border-green-400 bg-green-50 text-slate-800'
                    : 'border-slate-200 text-slate-500 hover:border-green-300 hover:text-slate-700'
                }`}
              >
                <span className={`h-4 w-4 flex-shrink-0 rounded border ${selectedStaff.has(s.id) ? 'border-green-500 bg-green-500' : 'border-slate-300'}`}>
                  {selectedStaff.has(s.id) && <svg viewBox="0 0 12 12" fill="white"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                </span>
                <span className="flex-1 font-medium">{s.last_name} {s.first_name}</span>
                <span className="text-xs text-slate-400">{s.role}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Suspendidos — no pueden ser convocados */}
      {suspended.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-red-400">
            Suspendidos ({suspended.length})
          </p>
          <div className="space-y-1">
            {suspended.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 opacity-70"
              >
                <span className="w-6 text-right text-xs text-red-300">{p.jersey_number ?? '—'}</span>
                <span className="flex-1 text-sm text-red-700">{p.last_name} {p.first_name}</span>
                <span className="text-xs font-semibold text-red-400">🚫 Suspendido</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Guardando...' : 'Guardar alineación'}
      </button>
    </div>
  );
}

function PlayerRow({ player, entry, onToggle, onUpdate }: {
  player: Player;
  entry: { selected: boolean; is_starter: boolean; shirt_number: string; position_label: string };
  onToggle: (id: string) => void;
  onUpdate: (id: string, field: 'is_starter' | 'shirt_number' | 'position_label', value: string | boolean) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={entry.shirt_number}
          onChange={(e) => onUpdate(player.id, 'shirt_number', e.target.value)}
          placeholder="#"
          className="w-12 rounded border border-slate-300 px-1.5 py-1 text-center text-xs focus:outline-none focus:border-green-500"
        />
        <span className="flex-1 text-sm font-medium text-slate-800">
          {player.last_name} {player.first_name}
        </span>
        <button
          onClick={() => onToggle(player.id)}
          className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600"
        >
          ✕
        </button>
      </div>
      <div className="flex gap-2">
        <select
          value={entry.position_label}
          onChange={(e) => onUpdate(player.id, 'position_label', e.target.value)}
          className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:border-green-500"
        >
          {POSITIONS.map((pos) => (
            <option key={pos} value={pos}>{pos || 'Posición...'}</option>
          ))}
        </select>
        <div className="flex rounded border border-slate-200 overflow-hidden text-xs font-semibold">
          <button
            onClick={() => onUpdate(player.id, 'is_starter', true)}
            className={`px-3 py-1 transition-colors ${entry.is_starter ? 'bg-green-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Titular
          </button>
          <button
            onClick={() => onUpdate(player.id, 'is_starter', false)}
            className={`px-3 py-1 transition-colors ${!entry.is_starter ? 'bg-slate-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Suplente
          </button>
        </div>
      </div>
    </div>
  );
}
