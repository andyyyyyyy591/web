'use client';

import { useState } from 'react';
import { createSeason, createTournamentsForSeason } from '@/lib/actions/seasons';
import { Button } from '@/components/ui/Button';

interface Tournament {
  id: string;
  name: string;
  division: { name: string } | null;
}

interface Season {
  id: string;
  name: string;
  year: number;
  start_date: string | null;
  end_date: string | null;
  tournaments: Tournament[];
}

interface Props {
  initialSeasons: Season[];
}

export function TemporadasForm({ initialSeasons }: Props) {
  const [seasons, setSeasons] = useState<Season[]>(initialSeasons);
  const [loading, setLoading] = useState(false);
  const [loadingSeasonId, setLoadingSeasonId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function handleCreateSeason(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const result = await createSeason({
      name,
      year: parseInt(year),
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      const newSeason: Season = { ...result.data, tournaments: [] };
      setSeasons((prev) => [newSeason, ...prev]);
      setMessage(`Temporada "${name}" creada.`);
      setName('');
      setStartDate('');
      setEndDate('');
      setShowForm(false);
    }
  }

  async function handleCreateTournaments(seasonId: string, seasonName: string) {
    setLoadingSeasonId(seasonId);
    setError(null);
    setMessage(null);
    const result = await createTournamentsForSeason(seasonId);
    setLoadingSeasonId(null);
    if (result.error) {
      setError(result.error);
    } else {
      setMessage(`Torneos creados para "${seasonName}".`);
      // Refresh seasons list
      window.location.reload();
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Temporadas</h1>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : '+ Nueva temporada'}
        </Button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {message && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreateSeason} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold text-slate-800">Nueva temporada</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nombre *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Torneo Clausura 2026"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Año *</label>
            <input type="number" required value={year} onChange={(e) => setYear(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Inicio</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Fin</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Creando...' : 'Crear temporada'}
          </Button>
        </form>
      )}

      {/* Seasons list */}
      <div className="space-y-3">
        {seasons.length === 0 && (
          <p className="text-sm text-slate-500">No hay temporadas aún.</p>
        )}
        {seasons.map((season) => {
          const hasTournaments = season.tournaments.length > 0;
          const isCreating = loadingSeasonId === season.id;
          return (
            <div key={season.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{season.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {season.year}
                    {season.start_date && ` · ${season.start_date}`}
                    {season.end_date && ` → ${season.end_date}`}
                  </p>
                </div>
                {!hasTournaments && (
                  <button
                    onClick={() => handleCreateTournaments(season.id, season.name)}
                    disabled={isCreating}
                    className="flex-shrink-0 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {isCreating ? 'Creando...' : 'Crear torneos'}
                  </button>
                )}
              </div>

              {hasTournaments ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {season.tournaments.map((t) => (
                    <span key={t.id} className="rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      {t.division?.name ?? t.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-400">Sin torneos — presioná "Crear torneos" para generarlos automáticamente.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
