'use client';

import { useState } from 'react';
import { updateMatchStatus } from '@/lib/actions/matches';
import type { Match, MatchStatus } from '@/types';
import { Button } from '@/components/ui/Button';

interface MatchStatusControlProps {
  match: Match;
}

const TRANSITIONS: Array<{
  from: MatchStatus[];
  to: MatchStatus;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
}> = [
  { from: ['scheduled'],        to: 'first_half',        label: 'Iniciar 1° Tiempo', variant: 'primary' },
  { from: ['first_half'],       to: 'halftime',          label: 'Medio Tiempo',       variant: 'secondary' },
  { from: ['halftime'],         to: 'second_half',       label: 'Iniciar 2° Tiempo',  variant: 'primary' },
  { from: ['second_half'],      to: 'extra_time_first',  label: 'Tiempo Extra',       variant: 'secondary' },
  { from: ['second_half', 'extra_time_second'], to: 'finished', label: 'Finalizar Partido', variant: 'danger' },
  { from: ['extra_time_first'], to: 'extra_time_break',  label: 'Descanso T.E.',      variant: 'secondary' },
  { from: ['extra_time_break'], to: 'extra_time_second', label: 'Iniciar T.E. 2°',    variant: 'primary' },
  { from: ['extra_time_second'], to: 'penalties',        label: 'Penales',            variant: 'secondary' },
];

export function MatchStatusControl({ match }: MatchStatusControlProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const available = TRANSITIONS.filter((t) => t.from.includes(match.status));

  async function handleTransition(to: MatchStatus) {
    setLoading(to);
    setError(null);
    const result = await updateMatchStatus(match.id, to);
    if (result.error) setError(result.error);
    setLoading(null);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 font-semibold text-slate-800">Control de partido</h3>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {available.map((t) => (
          <Button
            key={t.to}
            variant={t.variant ?? 'primary'}
            onClick={() => handleTransition(t.to)}
            disabled={loading !== null}
          >
            {loading === t.to ? 'Cargando...' : t.label}
          </Button>
        ))}
        {available.length === 0 && (
          <p className="text-sm text-slate-400">No hay acciones disponibles para este estado</p>
        )}
      </div>
    </div>
  );
}
