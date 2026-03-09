'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Player } from '@/types';
import { POSITION_LABELS } from '@/types';

interface Props {
  players: Player[];
  clubs: Array<{ id: string; name: string }>;
  isTeamAdmin: boolean;
}

export function JugadoresClient({ players, clubs, isTeamAdmin }: Props) {
  const [search, setSearch] = useState('');
  const [clubFilter, setClubFilter] = useState('');
  const [posFilter, setPosFilter] = useState('');

  const positions = useMemo(
    () => Array.from(new Set(players.map((p) => p.position).filter(Boolean))).sort(),
    [players],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return players.filter((p) => {
      if (q && !`${p.first_name} ${p.last_name}`.toLowerCase().includes(q)) return false;
      if (clubFilter && (p as any).club?.id !== clubFilter) return false;
      if (posFilter && p.position !== posFilter) return false;
      return true;
    });
  }, [players, search, clubFilter, posFilter]);

  const hasFilters = search || clubFilter || posFilter;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-44">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="search"
            placeholder="Buscar por nombre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {!isTeamAdmin && clubs.length > 0 && (
          <select
            value={clubFilter}
            onChange={(e) => setClubFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos los clubes</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        {positions.length > 0 && (
          <select
            value={posFilter}
            onChange={(e) => setPosFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todas las posiciones</option>
            {positions.map((pos) => (
              <option key={pos!} value={pos!}>{POSITION_LABELS[pos!]}</option>
            ))}
          </select>
        )}

        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setClubFilter(''); setPosFilter(''); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      <p className="text-xs text-slate-400">
        {filtered.length} jugador{filtered.length !== 1 ? 'es' : ''}
        {hasFilters && ` (de ${players.length})`}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400">
          Sin resultados
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/admin/jugadores/${p.id}`}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 transition hover:shadow-md hover:border-green-200"
            >
              {p.photo_url ? (
                <Image src={p.photo_url} alt={p.first_name} width={44} height={44}
                  className="h-11 w-11 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-500">
                  {p.first_name[0]}{p.last_name[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-800">
                  {p.first_name} {p.last_name}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  {!isTeamAdmin && 'club' in p && (
                    <span>{(p as any).club?.name}</span>
                  )}
                  {p.position && (
                    <span>{POSITION_LABELS[p.position]}</span>
                  )}
                </div>
              </div>
              <span className="text-xs text-slate-400">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
