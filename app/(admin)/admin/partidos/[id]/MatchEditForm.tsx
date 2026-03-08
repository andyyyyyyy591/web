'use client';

import { useState } from 'react';
import { updateMatch } from '@/lib/actions/matches';

interface Props {
  matchId: string;
  initialValues: {
    scheduled_at: string | null;
    stadium: string | null;
    referee: string | null;
    referee_assistant_1: string | null;
    referee_assistant_2: string | null;
    referee_fourth: string | null;
    notes: string | null;
  };
}

function toLocalDatetime(iso: string | null): string {
  if (!iso) return '';
  // datetime-local needs "YYYY-MM-DDTHH:MM"
  return iso.slice(0, 16);
}

export function MatchEditForm({ matchId, initialValues }: Props) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({
    scheduled_at: toLocalDatetime(initialValues.scheduled_at),
    stadium: initialValues.stadium ?? '',
    referee: initialValues.referee ?? '',
    referee_assistant_1: initialValues.referee_assistant_1 ?? '',
    referee_assistant_2: initialValues.referee_assistant_2 ?? '',
    referee_fourth: initialValues.referee_fourth ?? '',
    notes: initialValues.notes ?? '',
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
    setSaving(true);
    setError(null);
    const result = await updateMatch(matchId, {
      scheduled_at: values.scheduled_at ? new Date(values.scheduled_at).toISOString() : undefined,
      stadium: values.stadium || undefined,
      referee: values.referee || undefined,
      referee_assistant_1: values.referee_assistant_1 || undefined,
      referee_assistant_2: values.referee_assistant_2 || undefined,
      referee_fourth: values.referee_fourth || undefined,
      notes: values.notes || undefined,
    });
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    setSaved(true);
  }

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">Fecha y hora</span>
              <input
                type="datetime-local"
                value={values.scheduled_at}
                onChange={(e) => set('scheduled_at', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">Estadio</span>
              <input
                type="text"
                value={values.stadium}
                onChange={(e) => set('stadium', e.target.value)}
                placeholder="Ej. Estadio Municipal"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">Árbitro principal</span>
              <input
                type="text"
                value={values.referee}
                onChange={(e) => set('referee', e.target.value)}
                placeholder="Nombre del árbitro"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">4° árbitro</span>
              <input
                type="text"
                value={values.referee_fourth}
                onChange={(e) => set('referee_fourth', e.target.value)}
                placeholder="Nombre del 4° árbitro"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">Asistente 1</span>
              <input
                type="text"
                value={values.referee_assistant_1}
                onChange={(e) => set('referee_assistant_1', e.target.value)}
                placeholder="Nombre del asistente"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">Asistente 2</span>
              <input
                type="text"
                value={values.referee_assistant_2}
                onChange={(e) => set('referee_assistant_2', e.target.value)}
                placeholder="Nombre del asistente"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Notas</span>
            <textarea
              value={values.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              placeholder="Observaciones del partido…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none resize-none"
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
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
