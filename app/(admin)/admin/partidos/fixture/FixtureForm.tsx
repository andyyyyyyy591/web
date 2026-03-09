'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMatchDate, createMatchesBatch } from '@/lib/actions/matches';
import { getTournamentClubsForFixture } from '@/lib/actions/tournaments';
import { Button } from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';
import type { TournamentWithRelations, Club, TournamentFormat } from '@/types';

interface MatchRowData {
  homeClubId: string;
  awayClubId: string;
  scheduledAt: string;
  stadium: string;
  matchZone: 'zona_a' | 'zona_b' | 'interzonal' | '';
}

function emptyRow(): MatchRowData {
  return { homeClubId: '', awayClubId: '', scheduledAt: '', stadium: '', matchZone: '' };
}

function roundRobinPairs(ids: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++)
      pairs.push([ids[i], ids[j]]);
  return pairs;
}

const FORMAT_BADGE: Record<TournamentFormat, { label: string; color: string }> = {
  todos_contra_todos: { label: 'Todos contra todos', color: 'bg-blue-100 text-blue-700' },
  zonas:              { label: 'Zona A / Zona B',    color: 'bg-purple-100 text-purple-700' },
  eliminatorias:      { label: 'Eliminatorias',      color: 'bg-orange-100 text-orange-700' },
};

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

  const [tournamentId, setTournamentId] = useState('');
  const [fechaNumero, setFechaNumero] = useState('');
  const [fechaLabel, setFechaLabel] = useState('');
  const [matchDateId, setMatchDateId] = useState<string | null>(null);

  const [rows, setRows] = useState<MatchRowData[]>([emptyRow(), emptyRow()]);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Tournament clubs loaded when tournament is selected
  const [tournamentClubs, setTournamentClubs] = useState<{ club_id: string; club_name: string; zone: string | null }[]>([]);

  const bySeasonId = tournaments.reduce<Record<string, TournamentWithRelations[]>>((acc, t) => {
    const key = t.season.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const selectedTournament = tournaments.find((t) => t.id === tournamentId);

  // Derive format from division slug first (primera/reserva = zonas)
  const divSlug = selectedTournament?.division?.slug ?? '';
  const tournamentFormat: TournamentFormat =
    (divSlug === 'primera' || divSlug === 'reserva')
      ? 'zonas'
      : (selectedTournament?.format ?? 'todos_contra_todos');
  const badge = FORMAT_BADGE[tournamentFormat];

  // Clubs filtered to this tournament (or all if not loaded yet)
  const availableClubs = tournamentClubs.length > 0
    ? clubs.filter((c) => tournamentClubs.some((tc) => tc.club_id === c.id))
    : clubs;

  async function handleTournamentChange(id: string) {
    setTournamentId(id);
    if (id) {
      const tc = await getTournamentClubsForFixture(id);
      setTournamentClubs(tc);
    } else {
      setTournamentClubs([]);
    }
  }

  async function handleCreateFecha(e: React.FormEvent) {
    e.preventDefault();
    if (!tournamentId || !fechaNumero) return;
    setLoading(true);
    setError(null);
    const result = await createMatchDate(tournamentId, parseInt(fechaNumero), fechaLabel || undefined);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setMatchDateId(result.data!.id);
    setStep(2);
  }

  async function handleAutoGenerate() {
    setGenerating(true);
    setGenerateError(null);
    const tc = await getTournamentClubsForFixture(tournamentId);
    setTournamentClubs(tc);
    setGenerating(false);

    if (tc.length < 2) {
      setGenerateError('El torneo necesita al menos 2 equipos registrados');
      return;
    }

    if (tournamentFormat === 'zonas') {
      const a = tc.filter((c) => c.zone === 'A');
      const b = tc.filter((c) => c.zone === 'B');
      if (a.length < 2 && b.length < 2) {
        setGenerateError('Asigná los equipos a Zona A o Zona B en la gestión del torneo');
        return;
      }
      const generated: MatchRowData[] = [
        ...roundRobinPairs(a.map((c) => c.club_id)).map(([h, aw]) => ({ ...emptyRow(), homeClubId: h, awayClubId: aw, matchZone: 'zona_a' as const })),
        ...roundRobinPairs(b.map((c) => c.club_id)).map(([h, aw]) => ({ ...emptyRow(), homeClubId: h, awayClubId: aw, matchZone: 'zona_b' as const })),
      ];
      setRows(generated.length ? generated : [emptyRow()]);
    } else {
      const pairs = roundRobinPairs(tc.map((c) => c.club_id));
      setRows(pairs.length ? pairs.map(([h, aw]) => ({ ...emptyRow(), homeClubId: h, awayClubId: aw })) : [emptyRow()]);
    }
  }

  function updateRow(i: number, field: keyof MatchRowData, value: string) {
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }

  function addRow() { setRows((p) => [...p, emptyRow()]); }
  function removeRow(i: number) { setRows((p) => p.filter((_, idx) => idx !== i)); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const valid = rows.filter((r) => r.homeClubId && r.awayClubId && r.homeClubId !== r.awayClubId);
    if (valid.length === 0) { setError('Completá al menos un partido con local y visitante distintos'); return; }
    setLoading(true);
    setError(null);
    const payload = valid.map((r) => ({
      tournament_id: tournamentId,
      match_date_id: matchDateId ?? undefined,
      home_club_id: r.homeClubId,
      away_club_id: r.awayClubId,
      scheduled_at: r.scheduledAt ? new Date(r.scheduledAt).toISOString() : undefined,
      stadium: r.stadium || undefined,
      match_zone: (r.matchZone || undefined) as 'zona_a' | 'zona_b' | 'interzonal' | undefined,
    }));
    const result = await createMatchesBatch(payload);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setSaved(true);
  }

  if (saved) {
    return (
      <div className="max-w-lg space-y-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center space-y-3">
          <p className="text-4xl">✅</p>
          <p className="font-semibold text-green-800">Fixture guardado correctamente</p>
          <p className="text-sm text-green-600">
            {rows.filter((r) => r.homeClubId && r.awayClubId).length} partido(s) en{' '}
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

      {/* Paso 1 */}
      <div className={`rounded-xl border bg-white p-6 space-y-4 ${step === 2 ? 'border-green-200' : 'border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${step === 2 ? 'bg-green-600 text-white' : 'bg-slate-800 text-white'}`}>1</span>
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
                required value={tournamentId}
                onChange={(e) => handleTournamentChange(e.target.value)}
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
              {selectedTournament && (
                <span className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.color}`}>
                  {badge.label}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Número de fecha *</label>
                <input
                  required type="number" min="1" value={fechaNumero}
                  onChange={(e) => setFechaNumero(e.target.value)} placeholder="1"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Etiqueta (opcional)</label>
                <input
                  value={fechaLabel} onChange={(e) => setFechaLabel(e.target.value)}
                  placeholder="Fecha 1, Apertura…"
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

      {/* Paso 2 */}
      {step === 2 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white">2</span>
              <h2 className="font-semibold text-slate-800">Partidos de la fecha</h2>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.color}`}>
                {badge.label}
              </span>
            </div>
            {tournamentFormat !== 'eliminatorias' && (
              <button
                type="button" onClick={handleAutoGenerate} disabled={generating}
                className="flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
              >
                {generating ? '⏳ Generando...' : '⚡ Auto-generar cruces'}
              </button>
            )}
          </div>

          {generateError && (
            <p className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-600">{generateError}</p>
          )}

          <form onSubmit={handleSave} className="space-y-3">
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <MatchRowHeader format={tournamentFormat} />

            <MatchRowList
              rows={rows}
              clubs={availableClubs}
              format={tournamentFormat}
              onUpdate={updateRow}
              onRemove={removeRow}
            />

            <button
              type="button" onClick={addRow}
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

// ─── Header columnas ─────────────────────────────────────────────────────────

function MatchRowHeader({ format }: { format: TournamentFormat }) {
  if (format === 'zonas') {
    return (
      <div className="grid grid-cols-12 gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 px-1">
        <span className="col-span-1">Zona</span>
        <span className="col-span-3">Local</span>
        <span className="col-span-3">Visitante</span>
        <span className="col-span-2">Estadio</span>
        <span className="col-span-2">Fecha y hora</span>
        <span className="col-span-1" />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-12 gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 px-1">
      <span className="col-span-3">Local</span>
      <span className="col-span-3">Visitante</span>
      <span className="col-span-3">Estadio</span>
      <span className="col-span-2">Fecha y hora</span>
      <span className="col-span-1" />
    </div>
  );
}

// ─── Lista de filas ───────────────────────────────────────────────────────────

function MatchRowList({ rows, clubs, format, onUpdate, onRemove }: {
  rows: MatchRowData[];
  clubs: Club[];
  format: TournamentFormat;
  onUpdate: (i: number, field: keyof MatchRowData, val: string) => void;
  onRemove: (i: number) => void;
}) {
  if (format !== 'zonas') {
    return (
      <>
        {rows.map((row, i) => (
          <MatchRowInput key={i} row={row} index={i} clubs={clubs} format={format}
            onUpdate={onUpdate} onRemove={onRemove} canRemove={rows.length > 1} />
        ))}
      </>
    );
  }

  // Group by zone for visual separators
  const sections: { zone: string; entries: { row: MatchRowData; index: number }[] }[] = [];
  rows.forEach((row, index) => {
    const z = row.matchZone || '';
    const existing = sections.find((s) => s.zone === z);
    if (existing) existing.entries.push({ row, index });
    else sections.push({ zone: z, entries: [{ row, index }] });
  });

  return (
    <>
      {sections.map((section) => (
        <div key={section.zone || 'sin'} className="space-y-2">
          {section.zone === 'interzonal' ? (
            <p className="text-xs font-bold uppercase tracking-wide text-teal-600 pt-1">Interzonal</p>
          ) : section.zone === 'zona_a' ? (
            <p className="text-xs font-bold uppercase tracking-wide text-purple-600 pt-1">Zona A</p>
          ) : section.zone === 'zona_b' ? (
            <p className="text-xs font-bold uppercase tracking-wide text-purple-600 pt-1">Zona B</p>
          ) : (
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 pt-1">Sin zona</p>
          )}
          {section.entries.map(({ row, index }) => (
            <MatchRowInput key={index} row={row} index={index} clubs={clubs} format={format}
              onUpdate={onUpdate} onRemove={onRemove} canRemove={rows.length > 1} />
          ))}
        </div>
      ))}
    </>
  );
}

// ─── Fila individual ─────────────────────────────────────────────────────────

function MatchRowInput({ row, index, clubs, format, onUpdate, onRemove, canRemove }: {
  row: MatchRowData;
  index: number;
  clubs: Club[];
  format: TournamentFormat;
  onUpdate: (i: number, field: keyof MatchRowData, val: string) => void;
  onRemove: (i: number) => void;
  canRemove: boolean;
}) {
  const clubSelect = (field: 'homeClubId' | 'awayClubId', placeholder: string) => (
    <select
      value={row[field]}
      onChange={(e) => onUpdate(index, field, e.target.value)}
      className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
    >
      <option value="">{placeholder}</option>
      {clubs
        .filter((c) => field === 'awayClubId' ? c.id !== row.homeClubId : true)
        .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  );

  const stadiumInput = (
    <input type="text" value={row.stadium}
      onChange={(e) => onUpdate(index, 'stadium', e.target.value)}
      placeholder="Estadio…"
      className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-green-500 focus:outline-none"
    />
  );

  const timeInput = (
    <input type="datetime-local" value={row.scheduledAt}
      onChange={(e) => onUpdate(index, 'scheduledAt', e.target.value)}
      className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
    />
  );

  const removeBtn = canRemove && (
    <button type="button" onClick={() => onRemove(index)}
      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );

  if (format === 'zonas') {
    return (
      <div className="grid grid-cols-12 gap-2 items-center">
        <div className="col-span-1">
          <select
            value={row.matchZone}
            onChange={(e) => onUpdate(index, 'matchZone', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-1 py-2 text-xs font-semibold focus:border-purple-500 focus:outline-none text-center"
          >
            <option value="">—</option>
            <option value="zona_a">A</option>
            <option value="zona_b">B</option>
            <option value="interzonal">INT</option>
          </select>
        </div>
        <div className="col-span-3">{clubSelect('homeClubId', '— Local —')}</div>
        <div className="col-span-3">{clubSelect('awayClubId', '— Visitante —')}</div>
        <div className="col-span-2">{stadiumInput}</div>
        <div className="col-span-2">{timeInput}</div>
        <div className="col-span-1 flex justify-center">{removeBtn}</div>
      </div>
    );
  }

  // todos_contra_todos
  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <div className="col-span-3">{clubSelect('homeClubId', '— Local —')}</div>
      <div className="col-span-3">{clubSelect('awayClubId', '— Visitante —')}</div>
      <div className="col-span-3">{stadiumInput}</div>
      <div className="col-span-2">{timeInput}</div>
      <div className="col-span-1 flex justify-center">{removeBtn}</div>
    </div>
  );
}
