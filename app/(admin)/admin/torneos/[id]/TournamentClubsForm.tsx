'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Club, TournamentFormat } from '@/types';
import type { TournamentClubWithClub } from '@/lib/queries/tournament-clubs';
import {
  addClubToTournament,
  removeClubFromTournament,
  updateClubZone,
} from '@/lib/actions/tournament-clubs';
import { updateTournamentFormat } from '@/lib/actions/tournaments';

const FORMAT_OPTIONS: { value: TournamentFormat; label: string; desc: string }[] = [
  { value: 'todos_contra_todos', label: 'Todos contra todos', desc: 'Una tabla, todos los equipos juegan entre sí' },
  { value: 'zonas',              label: 'Zona A / Zona B',    desc: 'Dos grupos, tabla separada por zona' },
  { value: 'eliminatorias',      label: 'Cruces / Eliminatorias', desc: 'Ida y vuelta, llaves, sin tabla de posiciones' },
];

interface Props {
  tournamentId: string;
  allClubs: Club[];
  registered: TournamentClubWithClub[];
  format: TournamentFormat;
}

export function TournamentClubsForm({ tournamentId, allClubs, registered, format: initialFormat }: Props) {
  const [format, setFormat] = useState<TournamentFormat>(initialFormat);
  const [savingFormat, setSavingFormat] = useState(false);
  const [formatError, setFormatError] = useState<string | null>(null);

  const [items, setItems] = useState<TournamentClubWithClub[]>(registered);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [selectedZone, setSelectedZone] = useState<'A' | 'B' | ''>('');

  const hasZones = format === 'zonas';

  const registeredIds = new Set(items.map((i) => i.club_id));
  const availableClubs = allClubs.filter((c) => !registeredIds.has(c.id));

  async function handleFormatChange(newFormat: TournamentFormat) {
    if (newFormat === format) return;
    setSavingFormat(true);
    setFormatError(null);
    const result = await updateTournamentFormat(tournamentId, newFormat);
    setSavingFormat(false);
    if (result.error) { setFormatError(result.error); return; }
    setFormat(newFormat);
  }

  async function handleAdd() {
    if (!selectedClubId) return;
    setLoading('add');
    setError(null);
    const result = await addClubToTournament(
      tournamentId,
      selectedClubId,
      hasZones ? selectedZone || null : null,
    );
    setLoading(null);
    if (result.error) { setError(result.error); return; }
    const club = allClubs.find((c) => c.id === selectedClubId)!;
    setItems((prev) => [...prev, {
      id: `temp-${Date.now()}`,
      tournament_id: tournamentId,
      club_id: selectedClubId,
      zone: hasZones ? selectedZone || null : null,
      club,
    } as TournamentClubWithClub]);
    setSelectedClubId('');
    setSelectedZone('');
  }

  async function handleRemove(tc: TournamentClubWithClub) {
    setLoading(tc.id);
    const result = await removeClubFromTournament(tc.id, tournamentId);
    setLoading(null);
    if (result.error) { setError(result.error); return; }
    setItems((prev) => prev.filter((i) => i.id !== tc.id));
  }

  async function handleZoneChange(tc: TournamentClubWithClub, zone: string) {
    setLoading(tc.id + '-zone');
    const result = await updateClubZone(tc.id, zone || null, tournamentId);
    setLoading(null);
    if (result.error) { setError(result.error); return; }
    setItems((prev) => prev.map((i) => i.id === tc.id ? { ...i, zone: zone || null } : i));
  }

  const grouped = hasZones
    ? {
        A: items.filter((i) => i.zone === 'A'),
        B: items.filter((i) => i.zone === 'B'),
        sin: items.filter((i) => !i.zone),
      }
    : { all: items };

  return (
    <div className="space-y-6">
      {/* Formato del torneo */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Formato del torneo</h2>
          {savingFormat && <span className="text-xs text-slate-400">Guardando...</span>}
          {formatError && <span className="text-xs text-red-500">{formatError}</span>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleFormatChange(opt.value)}
              disabled={savingFormat}
              className={`rounded-xl border-2 p-3 text-left transition-colors ${
                format === opt.value
                  ? 'border-green-500 bg-green-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className={`text-sm font-semibold ${format === opt.value ? 'text-green-700' : 'text-slate-800'}`}>
                {opt.label}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {/* Add club form */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="font-semibold text-slate-800">Agregar equipo</h2>
        <div className="flex gap-2 flex-wrap">
          <select
            value={selectedClubId}
            onChange={(e) => setSelectedClubId(e.target.value)}
            className="flex-1 min-w-[180px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          >
            <option value="">Seleccionar equipo...</option>
            {availableClubs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {hasZones && (
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value as 'A' | 'B' | '')}
              className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            >
              <option value="">Sin zona</option>
              <option value="A">Zona A</option>
              <option value="B">Zona B</option>
            </select>
          )}

          <button
            onClick={handleAdd}
            disabled={!selectedClubId || loading === 'add'}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading === 'add' ? 'Agregando...' : '+ Agregar'}
          </button>
        </div>
      </div>

      {/* Registered clubs */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-800 mb-3">
          Equipos registrados ({items.length})
        </h2>

        {items.length === 0 && (
          <p className="text-sm text-slate-400 py-4 text-center">
            No hay equipos registrados en este torneo todavía.
          </p>
        )}

        {hasZones ? (
          <div className="space-y-4">
            {(['A', 'B', 'sin'] as const).map((zKey) => {
              const group = (grouped as any)[zKey] as TournamentClubWithClub[];
              if (group.length === 0) return null;
              return (
                <div key={zKey}>
                  <p className="text-xs font-bold uppercase tracking-wide text-green-600 mb-1.5">
                    {zKey === 'sin' ? 'Sin zona asignada' : `Zona ${zKey}`}
                  </p>
                  <ClubList items={group} hasZones onRemove={handleRemove} onZoneChange={handleZoneChange} loading={loading} />
                </div>
              );
            })}
          </div>
        ) : (
          <ClubList items={(grouped as any).all} hasZones={false} onRemove={handleRemove} onZoneChange={handleZoneChange} loading={loading} />
        )}
      </div>
    </div>
  );
}

function ClubList({ items, hasZones, onRemove, onZoneChange, loading }: {
  items: TournamentClubWithClub[];
  hasZones: boolean;
  onRemove: (tc: TournamentClubWithClub) => void;
  onZoneChange: (tc: TournamentClubWithClub, zone: string) => void;
  loading: string | null;
}) {
  return (
    <div className="space-y-1">
      {items.map((tc) => (
        <div key={tc.id} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5">
          {tc.club.logo_url ? (
            <Image src={tc.club.logo_url} alt={tc.club.name} width={28} height={28}
              className="h-7 w-7 rounded-full object-contain flex-shrink-0" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 flex-shrink-0">
              {tc.club.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="flex-1 text-sm font-medium text-slate-800">{tc.club.name}</span>

          {hasZones && (
            <select
              value={tc.zone ?? ''}
              onChange={(e) => onZoneChange(tc, e.target.value)}
              disabled={loading === tc.id + '-zone'}
              className="w-24 rounded border border-slate-200 px-1.5 py-1 text-xs focus:outline-none focus:border-green-500"
            >
              <option value="">Sin zona</option>
              <option value="A">Zona A</option>
              <option value="B">Zona B</option>
            </select>
          )}

          <button
            onClick={() => onRemove(tc)}
            disabled={loading === tc.id}
            className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
          >
            {loading === tc.id ? '...' : '✕'}
          </button>
        </div>
      ))}
    </div>
  );
}
