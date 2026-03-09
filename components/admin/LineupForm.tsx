'use client';

import { useState } from 'react';
import { saveLineup, type LineupEntry } from '@/lib/actions/lineups';
import type { Player, MatchLineupWithPlayer } from '@/types';

interface Props {
  matchId: string;
  clubId: string;
  clubName: string;
  players: Player[];
  existingLineup: MatchLineupWithPlayer[];
}

const POSITIONS = ['', 'ARQ', 'DFC', 'LD', 'LI', 'MCD', 'MC', 'MCO', 'MI', 'MD', 'SD', 'DC', 'DEL'];

export function LineupForm({ matchId, clubId, clubName, players, existingLineup }: Props) {
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

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playerSearch, setPlayerSearch] = useState('');

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

    const result = await saveLineup(matchId, clubId, lineupEntries);
    setSaving(false);
    if (result.error) setError(result.error);
    else setMessage('Alineación guardada.');
  }

  const starters = players.filter((p) => entries[p.id]?.selected && entries[p.id]?.is_starter);
  const subs = players.filter((p) => entries[p.id]?.selected && !entries[p.id]?.is_starter);
  const unselected = players.filter((p) => !entries[p.id]?.selected);

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

      {/* Titulares */}
      {starters.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Titulares</p>
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
