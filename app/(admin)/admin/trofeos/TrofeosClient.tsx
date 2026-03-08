'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTrophy, deleteTrophy } from '@/lib/actions/trophies';
import { Button } from '@/components/ui/Button';
import type { Club } from '@/types';

interface TrophyRow {
  id: string;
  club_id: string;
  name: string;
  year: number | null;
  club: { name: string };
}

export function TrofeosClient({ clubs, trophies }: { clubs: Club[]; trophies: TrophyRow[] }) {
  const router = useRouter();
  const [clubId, setClubId] = useState('');
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createTrophy({
        club_id: clubId,
        name,
        year: year ? parseInt(year) : undefined,
      });
      if (result.error) setError(result.error);
      else { setName(''); setYear(''); router.refresh(); }
    });
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTrophy(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Add form */}
      <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-slate-800">Agregar trofeo</h2>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Club *</label>
          <select required value={clubId} onChange={(e) => setClubId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500">
            <option value="">— Seleccionar club —</option>
            {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nombre del trofeo *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Torneo Apertura"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Año</label>
            <input type="number" value={year} onChange={(e) => setYear(e.target.value)}
              placeholder="2024"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
          </div>
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : '+ Agregar trofeo'}
        </Button>
      </form>

      {/* List */}
      {trophies.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-slate-800">Trofeos cargados</h2>
          {trophies.map((t) => (
            <div key={t.id} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <span className="text-xl">🏆</span>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{t.name}</p>
                <p className="text-sm text-slate-500">{t.club.name}{t.year ? ` · ${t.year}` : ''}</p>
              </div>
              <button onClick={() => handleDelete(t.id)} disabled={isPending}
                className="text-xs font-medium text-red-500 hover:text-red-700">
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
