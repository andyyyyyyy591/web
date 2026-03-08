'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { SuspendedPlayer } from '@/lib/queries/suspensions';
import { upsertSuspension, deleteSuspension } from '@/lib/actions/suspensions';

interface Tournament {
  id: string;
  name: string;
  division: { label: string };
}

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  club_id: string;
  club_name: string;
}

interface SuspRow extends SuspendedPlayer {
  tournamentId: string;
  tournamentName: string;
  divisionLabel: string;
}

interface Props {
  tournaments: Tournament[];
  initialData: Array<{
    tournament: Tournament;
    suspensions: SuspendedPlayer[];
  }>;
  players: Player[];
}

const BLANK_FORM = {
  id: undefined as string | undefined,
  tournamentId: '',
  playerId: '',
  reason: 'Suspensión manual',
  cardDate: '',
  suspDate: '',
  suspUntilDate: '',
  notes: '',
};

export function SuspensionesAdmin({ tournaments, initialData, players }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const pending: SuspRow[] = initialData.flatMap((d) =>
    d.suspensions
      .filter((s) => !s.served)
      .map((s) => ({ ...s, tournamentId: d.tournament.id, tournamentName: d.tournament.name, divisionLabel: d.tournament.division.label }))
  );
  const served: SuspRow[] = initialData.flatMap((d) =>
    d.suspensions
      .filter((s) => s.served)
      .map((s) => ({ ...s, tournamentId: d.tournament.id, tournamentName: d.tournament.name, divisionLabel: d.tournament.division.label }))
  );

  function openAdd() {
    setForm({ ...BLANK_FORM, tournamentId: tournaments[0]?.id ?? '' });
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(s: SuspRow) {
    setForm({
      // If it's a manual record, edit it in-place. If computed, create a new override.
      id: s.manual_id,
      tournamentId: s.tournamentId,
      playerId: s.player_id,
      reason: s.reason,
      cardDate: s.card_match_date !== null && s.card_match_date !== undefined ? String(s.card_match_date) : '',
      suspDate: String(s.suspended_for_date),
      suspUntilDate: s.suspended_until_date != null ? String(s.suspended_until_date) : '',
      notes: s.notes ?? '',
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.playerId || !form.suspDate || !form.tournamentId) return;
    setSaving(true);
    setFormError(null);

    const result = await upsertSuspension({
      id: form.id,
      player_id: form.playerId,
      tournament_id: form.tournamentId,
      reason: form.reason || 'Suspensión manual',
      card_match_date: form.cardDate ? parseInt(form.cardDate) : null,
      suspended_for_date: parseInt(form.suspDate),
      suspended_until_date: form.suspUntilDate ? parseInt(form.suspUntilDate) : null,
      notes: form.notes || null,
    });

    setSaving(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setModalOpen(false);
    window.location.reload();
  }

  async function handleDelete(manualId: string) {
    if (!confirm('¿Eliminar esta suspensión manual?')) return;
    setDeleting(manualId);
    const result = await deleteSuspension(manualId);
    setDeleting(null);
    if (result.error) { alert(result.error); return; }
    window.location.reload();
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Suspensiones y Disciplina</h1>
          <p className="mt-1 text-sm text-slate-500">
            Roja = 1 partido · Doble amarilla = 1 partido · 5 amarillas = 1 partido
          </p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors"
        >
          + Agregar suspensión
        </button>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              {form.id ? 'Editar suspensión' : 'Nueva suspensión'}
            </h2>

            {formError && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Torneo */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">Torneo</span>
                <select
                  value={form.tournamentId}
                  onChange={(e) => setForm((f) => ({ ...f, tournamentId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                  required
                  disabled={!!form.id}
                >
                  <option value="">Seleccionar torneo...</option>
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} — {t.division.label}</option>
                  ))}
                </select>
              </label>

              {/* Jugador */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">Jugador</span>
                <select
                  value={form.playerId}
                  onChange={(e) => setForm((f) => ({ ...f, playerId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                  required
                  disabled={!!form.id}
                >
                  <option value="">Seleccionar jugador...</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.last_name}, {p.first_name} — {p.club_name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Motivo */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">Motivo</span>
                <input
                  type="text"
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                  placeholder="Tarjeta roja, Acumulación, Conducta..."
                  required
                />
              </label>

              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    F. tarjeta <span className="font-normal text-slate-400">(opt.)</span>
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={form.cardDate}
                    onChange={(e) => setForm((f) => ({ ...f, cardDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                    placeholder="ej. 5"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">Susp. desde</span>
                  <input
                    type="number"
                    min="1"
                    value={form.suspDate}
                    onChange={(e) => setForm((f) => ({ ...f, suspDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                    placeholder="ej. 6"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Susp. hasta <span className="font-normal text-slate-400">(opt.)</span>
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={form.suspUntilDate}
                    onChange={(e) => setForm((f) => ({ ...f, suspUntilDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                    placeholder="ej. 8"
                  />
                </label>
              </div>
              {form.suspDate && form.suspUntilDate && parseInt(form.suspUntilDate) > parseInt(form.suspDate) && (
                <p className="text-xs text-orange-600 font-medium">
                  Suspendido por {parseInt(form.suspUntilDate) - parseInt(form.suspDate) + 1} fechas (F{form.suspDate} a F{form.suspUntilDate})
                </p>
              )}

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Notas <span className="font-normal text-slate-400">(opt.)</span>
                </span>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none resize-none"
                  placeholder="Observaciones adicionales..."
                />
              </label>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspendidos pendientes */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-800">Suspendidos</h2>
          {pending.length > 0 && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
              {pending.length}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-400">
            No hay jugadores suspendidos pendientes
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((s, i) => (
              <SuspCard
                key={`${s.player_id}-${s.card_match_date}-${i}`}
                s={s}
                onEdit={() => openEdit(s)}
                onDelete={s.manual_id ? () => handleDelete(s.manual_id!) : undefined}
                deleting={deleting === s.manual_id}
                pending
              />
            ))}
          </div>
        )}
      </section>

      {/* Ya cumplidas */}
      {served.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-slate-600">Suspensiones ya cumplidas</h2>
          <div className="space-y-2">
            {served.slice(0, 20).map((s, i) => (
              <SuspCard
                key={`served-${s.player_id}-${s.card_match_date}-${i}`}
                s={s}
                onEdit={() => openEdit(s)}
                onDelete={s.manual_id ? () => handleDelete(s.manual_id!) : undefined}
                deleting={deleting === s.manual_id}
                pending={false}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SuspCard({ s, onEdit, onDelete, deleting, pending }: {
  s: SuspRow;
  onEdit: () => void;
  onDelete?: () => void;
  deleting: boolean;
  pending: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-4 ${
      pending
        ? 'border-red-200 bg-red-50'
        : 'border-slate-200 bg-white opacity-60'
    }`}>
      {/* Avatar */}
      {s.photo_url ? (
        <Image src={s.photo_url} alt={s.first_name} width={44} height={44}
          className="h-11 w-11 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600">
          {s.first_name[0]}{s.last_name[0]}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900">{s.last_name}, {s.first_name}</p>
        <p className="text-xs text-slate-500">{s.club_name} · {s.divisionLabel}</p>
        <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
          <span className={`text-xs font-medium ${pending ? 'text-red-600' : 'text-slate-500'}`}>
            {s.reason}
          </span>
          {s.manual_id && (
            <span className="rounded bg-orange-100 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-orange-600">
              Manual
            </span>
          )}
        </div>
        {s.notes && (
          <p className="mt-0.5 text-xs text-slate-400 italic">{s.notes}</p>
        )}
      </div>

      {/* Dates + actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <div className="text-right mr-1">
          {s.card_match_date != null && (
            <p className="text-xs text-slate-400">Fecha {s.card_match_date}</p>
          )}
          <p className={`text-xs font-bold ${pending ? 'text-red-600' : 'text-slate-500'}`}>
            {s.suspended_until_date && s.suspended_until_date > s.suspended_for_date
              ? (pending
                  ? `Susp. F${s.suspended_for_date}–F${s.suspended_until_date}`
                  : `Cumplida F${s.suspended_for_date}–F${s.suspended_until_date}`)
              : (pending
                  ? `Susp. F${s.suspended_for_date}`
                  : `Cumplida F${s.suspended_for_date}`)
            }
          </p>
        </div>

        <button
          onClick={onEdit}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-white hover:text-slate-800 transition-colors"
          title="Editar"
        >
          ✏️
        </button>

        {onDelete && (
          <button
            onClick={onDelete}
            disabled={deleting}
            className="rounded-lg px-2.5 py-1.5 text-xs text-red-400 hover:bg-white hover:text-red-600 transition-colors disabled:opacity-40"
            title="Eliminar"
          >
            {deleting ? '...' : '✕'}
          </button>
        )}
      </div>
    </div>
  );
}
