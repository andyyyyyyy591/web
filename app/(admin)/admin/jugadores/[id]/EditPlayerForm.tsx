'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePlayer } from '@/lib/actions/players';
import type { PlayerPosition, PlayerWithClub, Division } from '@/types';
import { POSITION_LABELS } from '@/types';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { BackButton } from '@/components/ui/BackButton';

export function EditPlayerForm({ player, divisions }: { player: PlayerWithClub; divisions: Division[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(player.first_name);
  const [lastName, setLastName] = useState(player.last_name);
  const [dob, setDob] = useState(player.date_of_birth ?? '');
  const [position, setPosition] = useState<PlayerPosition | ''>(player.position ?? '');
  const [nationality, setNationality] = useState(player.nationality);
  const [photoUrl, setPhotoUrl] = useState(player.photo_url ?? '');
  const [jerseyNumber, setJerseyNumber] = useState(player.jersey_number?.toString() ?? '');
  const [primaryDivisionId, setPrimaryDivisionId] = useState(player.primary_division_id ?? '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await updatePlayer(player.id, {
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dob || undefined,
      position: (position || undefined) as PlayerPosition | undefined,
      nationality,
      photo_url: photoUrl || undefined,
      jersey_number: jerseyNumber ? parseInt(jerseyNumber) : undefined,
      primary_division_id: primaryDivisionId || null,
    });
    setLoading(false);
    if (result.error) setError(result.error);
    else router.push('/admin/jugadores');
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <BackButton href="/admin/jugadores" />
        <h1 className="text-2xl font-bold text-slate-900">Editar jugador</h1>
      </div>
      <p className="text-sm text-slate-500">Club: <span className="font-medium text-slate-700">{player.club.name}</span></p>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <ImageUpload
          bucket="photos"
          currentUrl={photoUrl || null}
          onUploaded={setPhotoUrl}
          label="Foto del jugador"
        />

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

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Categoría principal</label>
          <select
            value={primaryDivisionId}
            onChange={(e) => setPrimaryDivisionId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">— Sin categoría asignada —</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar cambios'}</Button>
          <Button type="button" variant="secondary" onClick={() => router.push('/admin/jugadores')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
