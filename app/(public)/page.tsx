'use client';

import { useState, useEffect } from 'react';
import { DateBar } from '@/components/partidos/DateBar';
import { MatchRow } from '@/components/partidos/MatchRow';
import type { MatchWithClubs } from '@/types';

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const DIVISION_ORDER = ['primera', 'reserva', 'septima', 'quinta', 'cuarta'];

function groupByDivision(matches: MatchWithClubs[]) {
  const map = new Map<string, { label: string; slug: string; matches: MatchWithClubs[] }>();
  for (const m of matches) {
    const slug = m.tournament.division.slug;
    if (!map.has(slug)) {
      map.set(slug, { label: m.tournament.division.label, slug, matches: [] });
    }
    map.get(slug)!.matches.push(m);
  }
  return [...map.values()].sort((a, b) => {
    const ai = DIVISION_ORDER.indexOf(a.slug);
    const bi = DIVISION_ORDER.indexOf(b.slug);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

export default function PartidosPage() {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [liveMode, setLiveMode] = useState(false);
  const [matches, setMatches] = useState<MatchWithClubs[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchMatches(date: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches?date=${date}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMatches(data);
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLiveMatches() {
    setLoading(true);
    try {
      const res = await fetch('/api/matches?live=true');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMatches(data);
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (liveMode) fetchLiveMatches();
    else fetchMatches(selectedDate);
  }, [selectedDate, liveMode]);

  // Auto-refresh every 30s in live mode
  useEffect(() => {
    if (!liveMode) return;
    const id = setInterval(() => fetchLiveMatches(), 30_000);
    return () => clearInterval(id);
  }, [liveMode]);

  function handleLiveMode() {
    setLiveMode(true);
    fetchLiveMatches();
  }

  const displayMatches = matches;

  const groups = groupByDivision(displayMatches);

  return (
    <div className="flex flex-col">
      {/* Mode toggle */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <button
          onClick={handleLiveMode}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            liveMode ? 'bg-live text-white' : 'bg-elevated text-secondary hover:text-primary'
          }`}
        >
          {liveMode && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          )}
          En vivo
        </button>
        <button
          onClick={() => setLiveMode(false)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            !liveMode ? 'bg-accent text-white' : 'bg-elevated text-secondary hover:text-primary'
          }`}
        >
          Calendario
        </button>
      </div>

      {/* Date bar — hidden in live mode */}
      {!liveMode && (
        <DateBar selected={selectedDate} onChange={setSelectedDate} />
      )}

      {/* Match list */}
      <div className="mt-1">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : liveMode && displayMatches.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-4xl">⚽</p>
            <p className="mt-3 text-sm text-secondary">No hay partidos en vivo</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-4xl">📅</p>
            <p className="mt-3 text-sm text-secondary">No hay partidos este día</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.slug} className="mb-2">
              <div className="flex items-center gap-3 px-4 py-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">{group.label}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="divide-y divide-border">
                {group.matches.map((m) => (
                  <MatchRow key={m.id} match={m} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
