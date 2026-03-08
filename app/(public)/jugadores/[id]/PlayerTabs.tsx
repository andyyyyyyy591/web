'use client';

import { useState } from 'react';
import type { PlayerWithClub, MatchWithClubs } from '@/types';
import type { PlayerStats } from '@/lib/queries/players';
import { POSITION_LABELS } from '@/types';
import { MatchRow } from '@/components/partidos/MatchRow';

const TABS = ['Perfil', 'Partidos', 'Estadísticas'] as const;

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

interface Props {
  player: PlayerWithClub;
  stats: PlayerStats;
  matchHistory: MatchWithClubs[];
}

export function PlayerTabs({ player, stats, matchHistory }: Props) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Perfil');
  const age = calcAge(player.date_of_birth);

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
              activeTab === tab ? 'border-b-2 border-accent text-accent' : 'text-secondary hover:text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        {activeTab === 'Perfil' && (
          <div className="space-y-2">
            {player.jersey_number != null && (
              <InfoRow label="Número" value={`#${player.jersey_number}`} />
            )}
            {player.position && (
              <InfoRow label="Posición" value={POSITION_LABELS[player.position]} />
            )}
            {age && (
              <InfoRow label="Edad" value={`${age} años`} />
            )}
            {player.date_of_birth && (
              <InfoRow label="Fecha de nac." value={formatDate(player.date_of_birth)} />
            )}
            {player.nationality && (
              <InfoRow label="Nacionalidad" value={player.nationality} />
            )}
            {!player.jersey_number && !player.position && !age && !player.nationality && (
              <p className="py-8 text-center text-sm text-secondary">Sin información adicional</p>
            )}
          </div>
        )}

        {activeTab === 'Partidos' && (
          matchHistory.length === 0 ? (
            <p className="py-8 text-center text-sm text-secondary">Sin partidos registrados</p>
          ) : (
            <div className="-mx-4 divide-y divide-border">
              {matchHistory.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </div>
          )
        )}

        {activeTab === 'Estadísticas' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Partidos" value={stats.matches} />
              <StatCard label="Goles" value={stats.goals} color="accent" />
              <StatCard label="Amarillas" value={stats.yellowCards} color="yellow" />
              <StatCard label="Rojas" value={stats.redCards} color="red" />
            </div>
            {stats.ownGoals > 0 && (
              <p className="text-xs text-center text-secondary">
                {stats.ownGoals} gol{stats.ownGoals !== 1 ? 'es' : ''} en contra
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-elevated px-4 py-3">
      <span className="text-xs font-semibold text-secondary">{label}</span>
      <span className="text-sm font-semibold text-primary">{value}</span>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: 'accent' | 'yellow' | 'red' }) {
  const valueClass = color === 'accent' ? 'text-accent' : color === 'yellow' ? 'text-yellow-400' : color === 'red' ? 'text-live' : 'text-primary';
  return (
    <div className="flex flex-col items-center rounded-2xl bg-elevated py-5">
      <span className={`text-4xl font-black tabular-nums ${valueClass}`}>{value}</span>
      <span className="mt-1.5 text-xs font-medium text-secondary">{label}</span>
    </div>
  );
}
