'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMatch } from '@/lib/actions/matches';
import { getTournamentClubsForFixture } from '@/lib/actions/tournaments';
import { Button } from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';
import type { TournamentWithRelations, Club } from '@/types';

const RONDAS = ['Cuartos de final', 'Semifinal', 'Final'];

interface Props {
  tournaments: TournamentWithRelations[];
  clubs: Club[];
}

export function NuevoPartidoForm({ tournaments, clubs }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tournamentId, setTournamentId] = useState('');
  const [instancia, setInstancia] = useState('');
  const [instanciaCustom, setInstanciaCustom] = useState('');
  const [homeClubId, setHomeClubId] = useState('');
  const [awayClubId, setAwayClubId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [stadium, setStadium] = useState('');
  const [referee, setReferee] = useState('');

  const [tournamentClubs, setTournamentClubs] = useState<{ club_id: string; club_name: string; zone: string | null }[]>([]);

  const bySeasonId = tournaments.reduce<Record<string, TournamentWithRelations[]>>((acc, t) => {
    const key = t.season.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  // Show all tournament clubs (no zone filter)
  const availableClubs = tournamentClubs.length > 0
    ? clubs.filter((c) => tournamentClubs.some((t) => t.club_id === c.id))
    : clubs;

  async function handleTournamentChange(id: string) {
    setTournamentId(id);
    setHomeClubId('');
    setAwayClubId('');
    if (id) {
      const tc = await getTournamentClubsForFixture(id);
      setTournamentClubs(tc);
    } else {
      setTournamentClubs([]);
    }
  }

  const roundLabel = instancia === 'Otro…' ? instanciaCustom : instancia;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (homeClubId === awayClubId) { setError('El local y visitante no pueden ser el mismo'); return; }
    setLoading(true);
    setError(null);
    const result = await createMatch({
      tournament_id: tournamentId,
      home_club_id: homeClubId,
      away_club_id: awayClubId,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      stadium: stadium || undefined,
      referee: referee || undefined,
      round_label: roundLabel || undefined,
    });
    setLoading(false);
    if (result.error) setError(result.error);
    else router.push('/admin/partidos');
  }

  const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500';

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <BackButton href="/admin/partidos" />
        <h1 className="text-2xl font-bold text-slate-900">Nuevo cruce</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        {/* Torneo */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Torneo *</label>
          <select required value={tournamentId} onChange={(e) => handleTournamentChange(e.target.value)} className={inputCls}>
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

        {/* Instancia */}
        {tournamentId && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Instancia</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {RONDAS.map((r) => (
                <button
                  key={r} type="button"
                  onClick={() => setInstancia(r)}
                  className={`rounded-xl border-2 px-2 py-2.5 text-xs font-semibold transition-colors text-center ${
                    instancia === r
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setInstancia('Otro…')}
              className={`w-full rounded-xl border-2 px-2 py-2 text-xs font-semibold transition-colors text-center ${
                instancia === 'Otro…'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              Otro…
            </button>
            {instancia === 'Otro…' && (
              <input
                type="text" value={instanciaCustom} onChange={(e) => setInstanciaCustom(e.target.value)}
                placeholder="Ej: 3er puesto, Repechaje…"
                className={`${inputCls} mt-2`}
                autoFocus
              />
            )}
          </div>
        )}

        {/* Equipos — todos los del torneo sin filtrar por zona */}
        {tournamentId && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Local *</label>
              <select required value={homeClubId} onChange={(e) => setHomeClubId(e.target.value)} className={inputCls}>
                <option value="">— Local —</option>
                {availableClubs.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Visitante *</label>
              <select required value={awayClubId} onChange={(e) => setAwayClubId(e.target.value)} className={inputCls}>
                <option value="">— Visitante —</option>
                {availableClubs.filter((c) => c.id !== homeClubId).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Fecha y estadio */}
        {tournamentId && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Fecha y hora</label>
              <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Estadio</label>
              <input type="text" value={stadium} onChange={(e) => setStadium(e.target.value)} placeholder="Ej. Estadio Municipal" className={inputCls} />
            </div>
          </div>
        )}

        {/* Árbitro principal */}
        {tournamentId && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Árbitro principal</label>
            <input type="text" value={referee} onChange={(e) => setReferee(e.target.value)} placeholder="Nombre del árbitro" className={inputCls} />
          </div>
        )}

        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <Button type="submit" disabled={loading || !tournamentId || !homeClubId || !awayClubId}>
            {loading ? 'Guardando...' : 'Crear cruce'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push('/admin/partidos')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
