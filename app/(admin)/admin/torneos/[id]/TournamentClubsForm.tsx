'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Club } from '@/types';
import type { TournamentClubWithClub } from '@/lib/queries/tournament-clubs';
import {
  addClubToTournament,
  removeClubFromTournament,
  updateClubZone,
} from '@/lib/actions/tournament-clubs';

interface Props {
  tournamentId: string;
  allClubs: Club[];
  registered: TournamentClubWithClub[];
  hasZones: boolean;
}

export function TournamentClubsForm({ tournamentId, allClubs, registered, hasZones }: Props) {
  const [items, setItems] = useState<TournamentClubWithClub[]>(registered);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [selectedZone, setSelectedZone] = useState<'A' | 'B' | ''>('');

  const registeredIds = new Set(items.map((i) => i.club_id));
  const availableClubs = allClubs.filter((c) => !registeredIds.has(c.id));

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
    // Optimistic update
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
