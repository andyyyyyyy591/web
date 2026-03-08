'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMatch } from '@/lib/actions/matches';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { BackButton } from '@/components/ui/BackButton';
import type { TournamentWithRelations, Club } from '@/types';

interface Props {
  tournaments: TournamentWithRelations[];
  clubs: Club[];
}

export function NuevoPartidoForm({ tournaments, clubs }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tournamentId, setTournamentId] = useState('');
  const [homeClubId, setHomeClubId] = useState('');
  const [awayClubId, setAwayClubId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [stadium, setStadium] = useState('');
  const [referee, setReferee] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (homeClubId === awayClubId) {
      setError('El equipo local y visitante no pueden ser el mismo');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await createMatch({
      tournament_id: tournamentId,
      home_club_id: homeClubId,
      away_club_id: awayClubId,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      stadium: stadium || undefined,
      referee: referee || undefined,
    });
    setLoading(false);
    if (result.error) setError(result.error);
    else router.push('/admin/partidos');
  }

  // Agrupa torneos por temporada para el optgroup
  const bySeasonId = tournaments.reduce<Record<string, TournamentWithRelations[]>>((acc, t) => {
    const key = t.season.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const awayOptions = clubs.filter((c) => c.id !== homeClubId);

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <BackButton href="/admin/partidos" />
        <h1 className="text-2xl font-bold text-slate-900">Nuevo partido</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <ImageUpload
          bucket="covers"
          currentUrl={imageUrl || null}
          onUploaded={setImageUrl}
          label="Imagen del partido (opcional)"
        />

        {/* Torneo */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Torneo *</label>
          <select
            required
            value={tournamentId}
            onChange={(e) => setTournamentId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">— Seleccionar torneo —</option>
            {Object.values(bySeasonId).map((group) => (
              <optgroup key={group[0].season.id} label={group[0].season.name}>
                {group.map((t) => (
                  <option key={t.id} value={t.id}>{t.division.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Equipos */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Local *</label>
            <select
              required
              value={homeClubId}
              onChange={(e) => setHomeClubId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">— Local —</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Visitante *</label>
            <select
              required
              value={awayClubId}
              onChange={(e) => setAwayClubId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">— Visitante —</option>
              {awayOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Fecha y hora</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Estadio</label>
            <input value={stadium} onChange={(e) => setStadium(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Árbitro</label>
            <input value={referee} onChange={(e) => setReferee(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Crear partido'}</Button>
          <Button type="button" variant="secondary" onClick={() => router.push('/admin/partidos')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
