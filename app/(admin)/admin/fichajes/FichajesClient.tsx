'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTransfer, deleteTransfer } from '@/lib/actions/transfers';
import { Button } from '@/components/ui/Button';
import type { Club } from '@/types';

interface PlayerRow { id: string; first_name: string; last_name: string; club_id: string }
interface SeasonRow { id: string; name: string }
interface TransferRow {
  id: string; type: 'in' | 'out'; notes: string | null;
  player: { first_name: string; last_name: string };
  club: { name: string };
  season: { name: string } | null;
}

interface Props {
  clubs: Club[];
  players: PlayerRow[];
  transfers: TransferRow[];
  seasons: SeasonRow[];
}

export function FichajesClient({ clubs, players, transfers, seasons }: Props) {
  const router = useRouter();
  const [clubId, setClubId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [type, setType] = useState<'in' | 'out'>('in');
  const [seasonId, setSeasonId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createTransfer({
        club_id: clubId,
        player_id: playerId,
        type,
        season_id: seasonId || undefined,
        notes: notes || undefined,
      });
      if (result.error) setError(result.error);
      else { setPlayerId(''); setNotes(''); router.refresh(); }
    });
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTransfer(id);
      router.refresh();
    });
  }

  const filteredPlayers = clubId
    ? players.filter((p) => p.club_id === clubId)
    : players;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Form */}
      <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-slate-800">Registrar fichaje</h2>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Club *</label>
            <select required value={clubId} onChange={(e) => { setClubId(e.target.value); setPlayerId(''); }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500">
              <option value="">— Seleccionar —</option>
              {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tipo *</label>
            <select value={type} onChange={(e) => setType(e.target.value as 'in' | 'out')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500">
              <option value="in">↓ Alta (llegó)</option>
              <option value="out">↑ Baja (se fue)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Jugador *</label>
          <select required value={playerId} onChange={(e) => setPlayerId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500">
            <option value="">— Seleccionar jugador —</option>
            {filteredPlayers.map((p) => (
              <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Temporada</label>
            <select value={seasonId} onChange={(e) => setSeasonId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500">
              <option value="">— Sin temporada —</option>
              {seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Notas</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Cedido, libre, etc."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
          </div>
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : '+ Registrar fichaje'}
        </Button>
      </form>

      {/* List */}
      {transfers.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-slate-800">Fichajes registrados</h2>
          {transfers.map((t) => (
            <div key={t.id} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <span className={`text-sm font-bold ${t.type === 'in' ? 'text-green-600' : 'text-slate-400'}`}>
                {t.type === 'in' ? '↓ Alta' : '↑ Baja'}
              </span>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">
                  {t.player.first_name} {t.player.last_name}
                </p>
                <p className="text-sm text-slate-500">
                  {t.club.name}
                  {t.season ? ` · ${t.season.name}` : ''}
                  {t.notes ? ` · ${t.notes}` : ''}
                </p>
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
