'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPlayer } from '@/lib/actions/players';
import type { PlayerPosition, Club } from '@/types';
import { POSITION_LABELS } from '@/types';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { BackButton } from '@/components/ui/BackButton';

export function NuevoJugadorForm({ clubs, lockedClubId }: { clubs: Club[]; lockedClubId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clubId, setClubId] = useState(lockedClubId ?? '');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [position, setPosition] = useState<PlayerPosition | ''>('');
  const [nationality, setNationality] = useState('Argentina');
  const [photoUrl, setPhotoUrl] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [playsInPrimera, setPlaysInPrimera] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await createPlayer({
      club_id: clubId,
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dob || undefined,
      position: (position || undefined) as PlayerPosition | undefined,
      nationality,
      photo_url: photoUrl || undefined,
      jersey_number: jerseyNumber ? parseInt(jerseyNumber) : undefined,
      plays_in_primera: playsInPrimera,
    });
    setLoading(false);
    if (result.error) setError(result.error);
    else router.push('/admin/jugadores');
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <BackButton href="/admin/jugadores" />
        <h1 className="text-2xl font-bold text-slate-900">Nuevo jugador</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <ImageUpload
          bucket="photos"
          currentUrl={photoUrl || null}
          onUploaded={setPhotoUrl}
          label="Foto del jugador"
        />

        {lockedClubId ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Club</label>
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {clubs.find((c) => c.id === lockedClubId)?.name ?? lockedClubId}
            </p>
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Club *</label>
            <select
              required
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">— Seleccionar club —</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nombre *</label>
            <input required value={firstName} onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Apellido *</label>
            <input required value={lastName} onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Fecha de nacimiento</label>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nacionalidad</label>
            <input value={nationality} onChange={(e) => setNationality(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Posición</label>
          <select value={position} onChange={(e) => setPosition(e.target.value as PlayerPosition | '')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500">
            <option value="">— Sin especificar —</option>
            {(Object.keys(POSITION_LABELS) as PlayerPosition[]).map((pos) => (
              <option key={pos} value={pos}>{POSITION_LABELS[pos]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Número de camiseta</label>
          <input type="number" min="1" max="99" value={jerseyNumber}
            onChange={(e) => setJerseyNumber(e.target.value)}
            placeholder="Ej: 10"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
          <input type="checkbox" id="plays_primera_new" checked={playsInPrimera}
            onChange={(e) => setPlaysInPrimera(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500" />
          <label htmlFor="plays_primera_new" className="text-sm font-medium text-slate-700 cursor-pointer">
            Juega en Primera
          </label>
          <span className="text-xs text-slate-400">(aparece en el plantel del club)</span>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Crear jugador'}</Button>
          <Button type="button" variant="secondary" onClick={() => router.push('/admin/jugadores')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
