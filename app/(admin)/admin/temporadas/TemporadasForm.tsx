'use client';

import { useState } from 'react';
import { createSeason, createTournamentsForSeason } from '@/lib/actions/seasons';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';

export function TemporadasForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [createdSeasonId, setCreatedSeasonId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');

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
      image_url: imageUrl || undefined,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setCreatedSeasonId(result.data?.id ?? null);
      setMessage(`Temporada "${name}" creada. Ahora puedes crear los torneos.`);
    }
  }

  async function handleCreateTournaments() {
    if (!createdSeasonId) return;
    setLoading(true);
    setError(null);
    const result = await createTournamentsForSeason(createdSeasonId);
    setLoading(false);
    if (result.error) setError(result.error);
    else setMessage('Torneos creados para todas las divisiones.');
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Temporadas</h1>

      <form onSubmit={handleCreateSeason} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-slate-800">Crear nueva temporada</h2>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {message && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}

        <ImageUpload
          bucket="covers"
          currentUrl={imageUrl || null}
          onUploaded={setImageUrl}
          label="Banner de la temporada (opcional)"
        />

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

      {createdSeasonId && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="mb-3 text-sm text-green-800">
            Temporada creada. ¿Crear torneos para todas las divisiones?
          </p>
          <Button onClick={handleCreateTournaments} disabled={loading}>
            {loading ? 'Creando torneos...' : 'Crear torneos automáticamente'}
          </Button>
        </div>
      )}
    </div>
  );
}
