'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTeamAdmin, deleteAdminUser } from '@/lib/actions/users';
import { Button } from '@/components/ui/Button';
import type { Club } from '@/types';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  club_id: string | null;
}

interface Props {
  users: AdminUser[];
  clubs: Club[];
}

export function AdminUsersClient({ users, clubs }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clubId, setClubId] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await createTeamAdmin(email, password, clubId);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(`Admin de equipo creado: ${email}`);
      setEmail(''); setPassword(''); setClubId('');
      setShowForm(false);
      router.refresh();
    }
  }

  async function handleDelete(userId: string, userEmail: string) {
    if (!confirm(`¿Eliminar usuario ${userEmail}?`)) return;
    await deleteAdminUser(userId);
    router.refresh();
  }

  const getClubName = (clubId: string | null) =>
    clubs.find((c) => c.id === clubId)?.name ?? 'Sin club';

  return (
    <div className="space-y-6">
      {success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
      )}

      {/* Lista de usuarios */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Rol</th>
              <th className="px-4 py-3 text-left">Club asignado</th>
              <th className="px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    u.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {u.role === 'admin' ? 'Super admin' : 'Admin equipo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {u.role === 'team_admin' ? getClubName(u.club_id) : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => handleDelete(u.id, u.email)}
                      className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">Sin usuarios admin registrados</p>
        )}
      </div>

      {/* Crear team admin */}
      <div>
        {!showForm ? (
          <Button onClick={() => setShowForm(true)}>+ Nuevo admin de equipo</Button>
        ) : (
          <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold text-slate-800">Crear admin de equipo</h2>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña temporal *</label>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Club asignado *</label>
              <select required value={clubId} onChange={(e) => setClubId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500">
                <option value="">— Seleccionar club —</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear usuario'}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
