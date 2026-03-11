'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { finalizeMatch, reopenMatch } from '@/lib/actions/matches';
import type { MatchStatus } from '@/types';

interface Props {
  matchId: string;
  currentStatus: MatchStatus;
  currentHomeScore: number | null;
  currentAwayScore: number | null;
  homeClubName: string;
  awayClubName: string;
}

const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-xl font-black tabular-nums focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500';

export function FinishMatchButton({
  matchId, currentStatus, currentHomeScore, currentAwayScore, homeClubName, awayClubName,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [homeScore, setHomeScore] = useState(currentHomeScore ?? 0);
  const [awayScore, setAwayScore] = useState(currentAwayScore ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const isFinished = currentStatus === 'finished';

  function handleFinalize() {
    setError(null);
    setDone(false);
    startTransition(async () => {
      const result = await finalizeMatch(matchId, homeScore, awayScore);
      if (result.error) { setError(result.error); return; }
      setDone(true);
      router.refresh();
    });
  }

  function handleReopen() {
    setError(null);
    setDone(false);
    startTransition(async () => {
      const result = await reopenMatch(matchId);
      if (result.error) { setError(result.error); return; }
      router.refresh();
    });
  }

  return (
    <div className={`rounded-xl border-2 p-5 space-y-4 ${isFinished ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">
          {isFinished ? 'Partido finalizado' : 'Cargar resultado final'}
        </h2>
        {isFinished && (
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
            ✓ Finalizado
          </span>
        )}
      </div>

      {/* Score inputs */}
      <div className="flex items-center gap-3">
        <div className="flex-1 text-center">
          <p className="mb-1 truncate text-xs font-medium text-slate-500">{homeClubName}</p>
          <input
            type="number"
            min={0}
            value={homeScore}
            onChange={(e) => { setHomeScore(Number(e.target.value)); setDone(false); }}
            className={inputCls}
          />
        </div>
        <span className="text-2xl font-black text-slate-300 mt-5">—</span>
        <div className="flex-1 text-center">
          <p className="mb-1 truncate text-xs font-medium text-slate-500">{awayClubName}</p>
          <input
            type="number"
            min={0}
            value={awayScore}
            onChange={(e) => { setAwayScore(Number(e.target.value)); setDone(false); }}
            className={inputCls}
          />
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleFinalize}
          disabled={isPending}
          className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Guardando...' : isFinished ? 'Actualizar resultado' : '✓ Marcar como finalizado'}
        </button>
        {done && !isPending && (
          <span className="text-sm font-medium text-green-600">✓ Guardado</span>
        )}
      </div>

      {isFinished && (
        <button
          onClick={handleReopen}
          disabled={isPending}
          className="text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
        >
          Reabrir partido (vuelve a programado)
        </button>
      )}
    </div>
  );
}
