'use client';

import { useState } from 'react';
import { updateMatch } from '@/lib/actions/matches';

interface Club { id: string; name: string; }

interface Props {
  matchId: string;
  clubs: Club[];
  initialValues: {
    home_club_id: string;
    away_club_id: string;
    home_score: number | null;
    away_score: number | null;
    scheduled_at: string | null;
    stadium: string | null;
    referee: string | null;
    referee_assistant_1: string | null;
    referee_assistant_2: string | null;
    referee_fourth: string | null;
    notes: string | null;
    match_zone: 'zona_a' | 'zona_b' | 'interzonal' | null;
    round_label: string | null;
  };
}

/** Converts a UTC ISO string to YYYY-MM-DDTHH:MM in Argentina time (UTC-3, no DST). */
function toArgDatetime(iso: string | null): string {
  if (!iso) return '';
  const dt = new Date(iso);
  // Argentina is UTC-3 with no DST
  const offset = -3 * 60; // minutes
  const local = new Date(dt.getTime() + offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

/** Parses a YYYY-MM-DDTHH:MM string (entered in Argentina time) back to UTC ISO. */
function argDatetimeToISO(value: string): string {
  // Append Argentina offset so Date parses correctly
  return new Date(value + '-03:00').toISOString();
}

export function MatchEditForm({ matchId, clubs, initialValues }: Props) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({
    home_club_id: initialValues.home_club_id,
    away_club_id: initialValues.away_club_id,
    home_score: initialValues.home_score ?? '',
    away_score: initialValues.away_score ?? '',
    scheduled_at: toArgDatetime(initialValues.scheduled_at),
    stadium: initialValues.stadium ?? '',
    referee: initialValues.referee ?? '',
    referee_assistant_1: initialValues.referee_assistant_1 ?? '',
    referee_assistant_2: initialValues.referee_assistant_2 ?? '',
    referee_fourth: initialValues.referee_fourth ?? '',
    notes: initialValues.notes ?? '',
    match_zone: initialValues.match_zone ?? '',
    round_label: initialValues.round_label ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (values.home_club_id === values.away_club_id) {
      setError('El local y visitante no pueden ser el mismo equipo');
      return;
    }
    setSaving(true);
    setError(null);
    const result = await updateMatch(matchId, {
      home_club_id: values.home_club_id || undefined,
      away_club_id: values.away_club_id || undefined,
      home_score: values.home_score !== '' ? Number(values.home_score) : null,
      away_score: values.away_score !== '' ? Number(values.away_score) : null,
      scheduled_at: values.scheduled_at ? argDatetimeToISO(values.scheduled_at) : undefined,
      stadium: values.stadium || undefined,
      referee: values.referee || undefined,
      referee_assistant_1: values.referee_assistant_1 || undefined,
      referee_assistant_2: values.referee_assistant_2 || undefined,
      referee_fourth: values.referee_fourth || undefined,
      notes: values.notes || undefined,
      match_zone: (values.match_zone as 'zona_a' | 'zona_b' | 'interzonal' | null) || null,
      round_label: values.round_label || null,
    });
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    setSaved(true);
  }

  const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500';

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <h2 className="font-semibold text-slate-800">Editar datos del partido</h2>
        <svg
          className={`h-5 w-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="border-t border-slate-100 px-6 pb-6 pt-4 space-y-4">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          {/* Equipos */}
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">Equipos</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Local</span>
                <select value={values.home_club_id} onChange={(e) => set('home_club_id', e.target.value)} className={inputCls}>
                  {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Visitante</span>
                <select value={values.away_club_id} onChange={(e) => set('away_club_id', e.target.value)} className={inputCls}>
                  {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            </div>
          </div>

          {/* Resultado */}
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">Resultado</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Goles local</span>
                <input
                  type="number" min={0} value={values.home_score}
                  onChange={(e) => set('home_score', e.target.value)}
                  placeholder="—" className={inputCls}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Goles visitante</span>
                <input
                  type="number" min={0} value={values.away_score}
                  onChange={(e) => set('away_score', e.target.value)}
                  placeholder="—" className={inputCls}
                />
              </label>
            </div>
          </div>

          {/* Fecha, estadio */}
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">Programación</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Fecha y hora</span>
                <input
                  type="datetime-local" value={values.scheduled_at}
                  onChange={(e) => set('scheduled_at', e.target.value)}
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Estadio</span>
                <input
                  type="text" value={values.stadium}
                  onChange={(e) => set('stadium', e.target.value)}
                  placeholder="Ej. Estadio Municipal" className={inputCls}
                />
              </label>
            </div>
          </div>

          {/* Zona / Instancia */}
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">Clasificación</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Zona del partido</span>
                <select value={values.match_zone} onChange={(e) => set('match_zone', e.target.value)} className={inputCls}>
                  <option value="">— Sin zona —</option>
                  <option value="zona_a">Zona A</option>
                  <option value="zona_b">Zona B</option>
                  <option value="interzonal">Interzonal</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Instancia / Ronda</span>
                <input
                  type="text" value={values.round_label}
                  onChange={(e) => set('round_label', e.target.value)}
                  placeholder="Ej. Semifinal, Final…" className={inputCls}
                />
              </label>
            </div>
          </div>

          {/* Árbitros */}
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">Árbitros</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Principal</span>
                <input type="text" value={values.referee} onChange={(e) => set('referee', e.target.value)} placeholder="Nombre del árbitro" className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">4° árbitro</span>
                <input type="text" value={values.referee_fourth} onChange={(e) => set('referee_fourth', e.target.value)} placeholder="Nombre" className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Asistente 1</span>
                <input type="text" value={values.referee_assistant_1} onChange={(e) => set('referee_assistant_1', e.target.value)} placeholder="Nombre" className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Asistente 2</span>
                <input type="text" value={values.referee_assistant_2} onChange={(e) => set('referee_assistant_2', e.target.value)} placeholder="Nombre" className={inputCls} />
              </label>
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Notas</span>
            <textarea
              value={values.notes} onChange={(e) => set('notes', e.target.value)}
              rows={2} placeholder="Observaciones del partido…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none resize-none"
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="submit" disabled={saving}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {saved && <span className="text-sm font-medium text-green-600">✓ Guardado</span>}
          </div>
        </form>
      )}
    </div>
  );
}
