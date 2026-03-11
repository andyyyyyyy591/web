'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createInjury, updateInjury, deleteInjury } from '@/lib/actions/injuries';
import type { Club, Player, PlayerInjuryWithPlayer } from '@/types';

interface Props {
  clubs: Club[];
  players: Player[];
  injuries: PlayerInjuryWithPlayer[];
  targetClubId: string | null;
  isSuperAdmin: boolean;
}

const BLANK = { playerId: '', description: '', estimatedRecovery: '', isActive: true };

export function LesionesClient({ clubs, players, injuries, targetClubId, isSuperAdmin }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState<string | null>(null);

  const activeInjuries = injuries.filter((i) => i.is_active);
  const pastInjuries = injuries.filter((i) => !i.is_active);

  function openCreate() {
    setEditingId(null);
    setForm(BLANK);
    setError(null);
    setShowForm(true);
  }

  function openEdit(inj: PlayerInjuryWithPlayer) {
    setEditingId(inj.id);
    setForm({
      playerId: inj.player_id,
      description: inj.description,
      estimatedRecovery: inj.estimated_recovery ?? '',
      isActive: inj.is_active,
    });
    setError(null);
    setShowForm(true);
  }

  function closeForm() {
    setEditingId(null);
    setForm(BLANK);
    setError(null);
    setShowForm(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!targetClubId) return;
    setError(null);
    startTransition(async () => {
      const payload = {
        description: form.description.trim(),
        estimated_recovery: form.estimatedRecovery.trim() || null,
        is_active: form.isActive,
      };
      const result = editingId
        ? await updateInjury(editingId, payload)
        : await createInjury({ player_id: form.playerId, club_id: targetClubId, ...payload });
      if (result.error) { setError(result.error); return; }
      closeForm();
      router.refresh();
    });
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      await deleteInjury(id);
      router.refresh();
    });
  }

  async function handleToggleActive(inj: PlayerInjuryWithPlayer) {
    startTransition(async () => {
      await updateInjury(inj.id, { is_active: !inj.is_active });
      router.refresh();
    });
  }


  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Lesiones</h1>
        {targetClubId && (
          <button
            onClick={openCreate}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            + Nueva lesión
          </button>
        )}
      </div>

      {/* Club selector (super admin only) */}
      {isSuperAdmin && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Club</label>
          <select
            value={targetClubId ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              router.push(val ? `/admin/lesiones?club=${val}` : '/admin/lesiones');
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">— Seleccionar club —</option>
            {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      {/* Form */}
      {showForm && targetClubId && (
        <form onSubmit={handleSave} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <h2 className="font-semibold text-slate-800">
            {editingId ? 'Editar lesión' : 'Registrar lesión'}
          </h2>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          {!editingId && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Jugador *</label>
              <select
                required
                value={form.playerId}
                onChange={(e) => setForm((f) => ({ ...f, playerId: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">— Seleccionar jugador —</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.last_name}, {p.first_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Lesión / motivo *</label>
            <input
              required
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Ej: Desgarro, Esguince de tobillo, Golpe en la rodilla…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tiempo estimado</label>
            <input
              value={form.estimatedRecovery}
              onChange={(e) => setForm((f) => ({ ...f, estimatedRecovery: e.target.value }))}
              placeholder="Ej: 2 semanas, 1 mes, hasta nuevo aviso…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
              Lesión activa
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Registrar'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {!targetClubId && !isSuperAdmin && (
        <p className="text-sm text-slate-400">Seleccioná un club para ver sus lesiones.</p>
      )}

      {targetClubId && injuries.length === 0 && (
        <p className="text-sm text-slate-400">No hay lesiones registradas.</p>
      )}

      {/* Lesiones activas */}
      {activeInjuries.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold text-slate-800">Lesionados actualmente</h2>
          {activeInjuries.map((inj) => (
            <InjuryRow
              key={inj.id}
              inj={inj}
              isPending={isPending}
              onEdit={() => openEdit(inj)}
              onToggle={() => handleToggleActive(inj)}
              onDelete={() => handleDelete(inj.id)}
            />
          ))}
        </section>
      )}

      {/* Lesiones inactivas / historial */}
      {pastInjuries.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold text-slate-500 text-sm uppercase tracking-wide">Historial</h2>
          {pastInjuries.map((inj) => (
            <InjuryRow
              key={inj.id}
              inj={inj}
              isPending={isPending}
              onEdit={() => openEdit(inj)}
              onToggle={() => handleToggleActive(inj)}
              onDelete={() => handleDelete(inj.id)}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function InjuryRow({
  inj, isPending, onEdit, onToggle, onDelete,
}: {
  inj: PlayerInjuryWithPlayer;
  isPending: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 ${inj.is_active ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
      <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
        {inj.player.photo_url ? (
          <Image src={inj.player.photo_url} alt={inj.player.first_name} width={36} height={36} className="object-cover w-full h-full" />
        ) : (
          <span className="text-[10px] font-bold text-slate-500">
            {inj.player.first_name.slice(0, 1)}{inj.player.last_name.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm">
          {inj.player.first_name} {inj.player.last_name}
        </p>
        <p className="text-sm text-slate-600">{inj.description}</p>
        {inj.estimated_recovery && (
          <p className="text-xs text-slate-400">{inj.estimated_recovery}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onToggle}
          disabled={isPending}
          className={`text-xs font-medium px-2 py-1 rounded-lg border transition-colors ${
            inj.is_active
              ? 'border-slate-200 text-slate-500 hover:bg-slate-50'
              : 'border-green-200 text-green-600 hover:bg-green-50'
          }`}
        >
          {inj.is_active ? 'Alta' : 'Activo'}
        </button>
        <button onClick={onEdit} disabled={isPending} className="text-xs font-medium text-blue-500 hover:text-blue-700">
          Editar
        </button>
        <button onClick={onDelete} disabled={isPending} className="text-xs font-medium text-red-500 hover:text-red-700">
          Eliminar
        </button>
      </div>
    </div>
  );
}
