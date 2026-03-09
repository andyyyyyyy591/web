'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageUpload } from '@/components/ui/ImageUpload';
import {
  createCoachingStaff,
  updateCoachingStaff,
  deactivateCoachingStaff,
} from '@/lib/actions/coaching-staff';
import type { CoachingStaff } from '@/types';

const ROLES = ['DT', 'Ayudante de campo', 'Preparador físico', 'Entrenador de arqueros', 'Kinesiólogo'];

interface Props {
  staff: (CoachingStaff & { club?: { name: string } })[];
  clubs: { id: string; name: string }[];
  isTeamAdmin: boolean;
  lockedClubId?: string;
}

interface FormState {
  first_name: string;
  last_name: string;
  role: string;
  photo_url: string;
}

const EMPTY_FORM: FormState = { first_name: '', last_name: '', role: 'DT', photo_url: '' };

export function CoachingStaffClient({ staff, clubs, isTeamAdmin, lockedClubId }: Props) {
  const [list, setList] = useState(staff);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [clubFilter, setClubFilter] = useState(lockedClubId ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!clubFilter) { setError('Seleccioná un club'); return; }
    setSaving(true);
    setError(null);
    const result = await createCoachingStaff({
      club_id: clubFilter,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      role: form.role,
      photo_url: form.photo_url || undefined,
    });
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    const club = clubs.find((c) => c.id === clubFilter);
    const newEntry = {
      id: crypto.randomUUID(),
      club_id: clubFilter,
      ...form,
      photo_url: form.photo_url || null,
      is_active: true,
      created_at: new Date().toISOString(),
      club: club ? { name: club.name } : undefined,
    };
    setList((prev) => [...prev, newEntry]);
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  async function handleUpdate(id: string) {
    setSaving(true);
    setError(null);
    const result = await updateCoachingStaff(id, {
      first_name: editForm.first_name.trim(),
      last_name: editForm.last_name.trim(),
      role: editForm.role,
      photo_url: editForm.photo_url || undefined,
    });
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    setList((prev) => prev.map((s) => s.id === id ? { ...s, ...editForm, photo_url: editForm.photo_url || null } : s));
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar a esta persona del cuerpo técnico?')) return;
    await deactivateCoachingStaff(id);
    setList((prev) => prev.filter((s) => s.id !== id));
  }

  const filtered = clubFilter
    ? list.filter((s) => s.club_id === clubFilter)
    : list;

  return (
    <div className="space-y-4">
      {/* Filtro por club (super_admin) */}
      {!isTeamAdmin && clubs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <select
            value={clubFilter}
            onChange={(e) => setClubFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos los clubes</option>
            {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      {/* Botón agregar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">{filtered.length} persona{filtered.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => { setShowForm((v) => !v); setError(null); setForm(EMPTY_FORM); }}
          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
        >
          {showForm ? 'Cancelar' : '+ Agregar'}
        </button>
      </div>

      {/* Formulario nuevo */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
          <h3 className="font-semibold text-slate-800">Nuevo integrante</h3>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          {!isTeamAdmin && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Club *</label>
              <select
                required
                value={clubFilter}
                onChange={(e) => setClubFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              >
                <option value="">Seleccionar club...</option>
                {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Nombre *</label>
              <input
                required value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Apellido *</label>
              <input
                required value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Rol *</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <ImageUpload
            bucket="photos"
            currentUrl={form.photo_url || null}
            onUploaded={(url) => setForm((f) => ({ ...f, photo_url: url }))}
            label="Foto (opcional)"
          />

          <button
            type="submit" disabled={saving}
            className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Agregar'}
          </button>
        </form>
      )}

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400">
          Sin integrantes en el cuerpo técnico
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              {editingId === s.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={editForm.first_name}
                      onChange={(e) => setEditForm((f) => ({ ...f, first_name: e.target.value }))}
                      placeholder="Nombre"
                      className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none"
                    />
                    <input
                      value={editForm.last_name}
                      onChange={(e) => setEditForm((f) => ({ ...f, last_name: e.target.value }))}
                      placeholder="Apellido"
                      className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none"
                    />
                  </div>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none"
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <ImageUpload
                    bucket="photos"
                    currentUrl={editForm.photo_url || null}
                    onUploaded={(url) => setEditForm((f) => ({ ...f, photo_url: url }))}
                    label="Foto"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(s.id)} disabled={saving}
                      className="flex-1 rounded-lg bg-green-600 py-1.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {s.photo_url ? (
                    <Image src={s.photo_url} alt={s.first_name} width={44} height={44}
                      className="h-11 w-11 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 flex-shrink-0">
                      {s.first_name[0]}{s.last_name[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800">{s.last_name} {s.first_name}</p>
                    <p className="text-xs text-slate-400">{s.role}</p>
                    {!isTeamAdmin && s.club && (
                      <p className="text-xs text-slate-300">{s.club.name}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setEditingId(s.id);
                        setEditForm({ first_name: s.first_name, last_name: s.last_name, role: s.role, photo_url: s.photo_url ?? '' });
                      }}
                      className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="rounded px-2 py-1 text-xs text-red-300 hover:bg-red-50 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
