'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMatchDate, createMatchesBatch } from '@/lib/actions/matches';
import { Button } from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';
import type { TournamentWithRelations, Club } from '@/types';

interface MatchRow {
  homeClubId: string;
  awayClubId: string;
  scheduledAt: string;
  stadium: string;
}

function emptyRow(): MatchRow {
  return { homeClubId: '', awayClubId: '', scheduledAt: '', stadium: '' };
}

interface Props {
  tournaments: TournamentWithRelations[];
  clubs: Club[];
}

export function FixtureForm({ tournaments, clubs }: Props) {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Paso 1
  const [tournamentId, setTournamentId] = useState('');
  const [fechaNumero, setFechaNumero] = useState('');
  const [fechaLabel, setFechaLabel] = useState('');
  const [matchDateId, setMatchDateId] = useState<string | null>(null);

  // Paso 2
  const [rows, setRows] = useState<MatchRow[]>([emptyRow(), emptyRow()]);

  // Grupos de torneos por temporada
  const bySeasonId = tournaments.reduce<Record<string, TournamentWithRelations[]>>((acc, t) => {
    const key = t.season.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  async function handleCreateFecha(e: React.FormEvent) {
    e.preventDefault();
    if (!tournamentId || !fechaNumero) return;
    setLoading(true);
    setError(null);
    const result = await createMatchDate(
      tournamentId,
      parseInt(fechaNumero),
      fechaLabel || undefined,
    );
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setMatchDateId(result.data!.id);
    setStep(2);
  }

  function updateRow(index: number, field: keyof MatchRow, value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSaveFixture(e: React.FormEvent) {
    e.preventDefault();
    const validRows = rows.filter((r) => r.homeClubId && r.awayClubId && r.homeClubId !== r.awayClubId);
    if (validRows.length === 0) {
      setError('Completá al menos un partido con local y visitante distintos');
      return;
    }
    setLoading(true);
    setError(null);
    const payload = validRows.map((r) => ({
      tournament_id: tournamentId,
      match_date_id: matchDateId ?? undefined,
      home_club_id: r.homeClubId,
      away_club_id: r.awayClubId,
      scheduled_at: r.scheduledAt ? new Date(r.scheduledAt).toISOString() : undefined,
      stadium: r.stadium || undefined,
    }));
    const result = await createMatchesBatch(payload);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setSaved(true);
  }

  const selectedTournament = tournaments.find((t) => t.id === tournamentId);

  if (saved) {
    return (
      <div className="max-w-lg space-y-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center space-y-3">
          <p className="text-4xl">✅</p>
          <p className="font-semibold text-green-800">
            Fixture guardado correctamente
          </p>
          <p className="text-sm text-green-600">
            {rows.filter((r) => r.homeClubId && r.awayClubId).length} partido(s) creado(s) en{' '}
            {fechaLabel || `Fecha ${fechaNumero}`}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button onClick={() => { setSaved(false); setStep(1); setRows([emptyRow(), emptyRow()]); setMatchDateId(null); }}>
              Cargar otra fecha
            </Button>
            <Button variant="secondary" onClick={() => router.push('/admin/partidos')}>
              Ver partidos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <BackButton href="/admin/partidos" />
        <h1 className="text-2xl font-bold text-slate-900">Cargar fixture</h1>
      </div>

      {/* Paso 1: torneo + fecha */}
      <div className={`rounded-xl border bg-white p-6 space-y-4 ${step === 2 ? 'border-green-200' : 'border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
            step === 2 ? 'bg-green-600 text-white' : 'bg-slate-800 text-white'
          }`}>1</span>
          <h2 className="font-semibold text-slate-800">Torneo y fecha</h2>
          {step === 2 && (
            <span className="ml-auto text-sm text-slate-500">
              {selectedTournament?.division.label} · {fechaLabel || `Fecha ${fechaNumero}`}
            </span>
          )}
        </div>

        {step === 1 && (
          <form onSubmit={handleCreateFecha} className="space-y-4">
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Número de fecha *</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={fechaNumero}
                  onChange={(e) => setFechaNumero(e.target.value)}
                  placeholder="1"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Etiqueta (opcional)</label>
                <input
                  value={fechaLabel}
                  onChange={(e) => setFechaLabel(e.target.value)}
                  placeholder="Semifinal, Fecha 5…"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading || !tournamentId || !fechaNumero}>
              {loading ? 'Creando...' : 'Continuar →'}
            </Button>
          </form>
        )}
      </div>

      {/* Paso 2: partidos */}
      {step === 2 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white">2</span>
            <h2 className="font-semibold text-slate-800">Partidos de la fecha</h2>
          </div>

          <form onSubmit={handleSaveFixture} className="space-y-3">
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            {/* Encabezado */}
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 px-1">
              <span className="col-span-4">Local</span>
              <span className="col-span-4">Visitante</span>
              <span className="col-span-3">Fecha y hora</span>
              <span className="col-span-1" />
            </div>

            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <select
                    value={row.homeClubId}
                    onChange={(e) => updateRow(i, 'homeClubId', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="">— Local —</option>
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-4">
                  <select
                    value={row.awayClubId}
                    onChange={(e) => updateRow(i, 'awayClubId', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="">— Visitante —</option>
                    {clubs
                      .filter((c) => c.id !== row.homeClubId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <input
                    type="datetime-local"
                    value={row.scheduledAt}
                    onChange={(e) => updateRow(i, 'scheduledAt', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addRow}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2.5 text-sm text-slate-500 hover:border-green-400 hover:text-green-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar partido
            </button>

            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : `Guardar ${rows.filter((r) => r.homeClubId && r.awayClubId).length} partido(s)`}
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.push('/admin/partidos')}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
