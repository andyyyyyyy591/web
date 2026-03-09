'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMatch } from '@/lib/actions/matches';
import { getTournamentClubsForFixture } from '@/lib/actions/tournaments';
import { Button } from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';
import type { TournamentWithRelations, Club, TournamentFormat } from '@/types';

const RONDAS = [
  'Cuartos de final',
  'Semifinal',
  'Final',
  'Otro…',
];

const FORMAT_BADGE: Record<TournamentFormat, { label: string; color: string }> = {
  todos_contra_todos: { label: 'Todos contra todos', color: 'bg-blue-100 text-blue-700' },
  zonas:              { label: 'Zona A / Zona B',    color: 'bg-purple-100 text-purple-700' },
  eliminatorias:      { label: 'Eliminatorias',      color: 'bg-orange-100 text-orange-700' },
};

interface Props {
  tournaments: TournamentWithRelations[];
  clubs: Club[];
}

export function NuevoPartidoForm({ tournaments, clubs }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tournamentId, setTournamentId] = useState('');
  const [homeClubId, setHomeClubId] = useState('');
  const [awayClubId, setAwayClubId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [stadium, setStadium] = useState('');

  // Árbitros
  const [referee, setReferee] = useState('');
  const [refereeAssistant1, setRefereeAssistant1] = useState('');
  const [refereeAssistant2, setRefereeAssistant2] = useState('');
  const [refereeFourth, setRefereeFourth] = useState('');

  // Ronda (para zonas y eliminatorias)
  const [rondaSelect, setRondaSelect] = useState('');
  const [rondaCustom, setRondaCustom] = useState('');

  // Clubes del torneo
  const [tournamentClubs, setTournamentClubs] = useState<{ club_id: string; club_name: string; zone: string | null }[]>([]);

  const bySeasonId = tournaments.reduce<Record<string, TournamentWithRelations[]>>((acc, t) => {
    const key = t.season.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const selectedTournament = tournaments.find((t) => t.id === tournamentId);
  const format: TournamentFormat = (selectedTournament as any)?.format ?? 'todos_contra_todos';
  const badge = FORMAT_BADGE[format];

  async function handleTournamentChange(id: string) {
    setTournamentId(id);
    setHomeClubId('');
    setAwayClubId('');
    setRondaSelect('');
    if (id) {
      const tc = await getTournamentClubsForFixture(id);
      setTournamentClubs(tc);
    } else {
      setTournamentClubs([]);
    }
  }

  // Todos los clubes del torneo sin filtrar por zona (cruces son interzonales)
  const availableClubs = tournamentClubs.length > 0
    ? clubs.filter((c) => tournamentClubs.some((t) => t.club_id === c.id))
    : clubs;

  // Para mostrar la zona de cada equipo junto a su nombre
  function clubLabel(clubId: string) {
    const tc = tournamentClubs.find((t) => t.club_id === clubId);
    return tc?.zone ? ` (Zona ${tc.zone})` : '';
  }

  const roundLabel = rondaSelect === 'Otro…' ? rondaCustom : rondaSelect;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (homeClubId === awayClubId) { setError('El local y visitante no pueden ser el mismo'); return; }
    setLoading(true);
    setError(null);
    const result = await createMatch({
      tournament_id: tournamentId,
      home_club_id: homeClubId,
      away_club_id: awayClubId,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      stadium: stadium || undefined,
      referee: referee || undefined,
      referee_assistant_1: refereeAssistant1 || undefined,
      referee_assistant_2: refereeAssistant2 || undefined,
      referee_fourth: refereeFourth || undefined,
      // No se guarda zone en cruces — la zona de c/equipo viene de tournament_clubs
      round_label: roundLabel || undefined,
    });
    setLoading(false);
    if (result.error) setError(result.error);
    else router.push('/admin/partidos');
  }

  const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500';

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <BackButton href="/admin/partidos" />
        <h1 className="text-2xl font-bold text-slate-900">Nuevo cruce</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        {/* Torneo */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Torneo *</label>
          <select required value={tournamentId} onChange={(e) => handleTournamentChange(e.target.value)} className={inputCls}>
            <option value="">— Seleccionar torneo —</option>
            {Object.values(bySeasonId).map((group) => (
              <optgroup key={group[0].season.id} label={group[0].season.name}>
                {group.map((t) => (
                  <option key={t.id} value={t.id}>{t.division.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
          {selectedTournament && (
            <span className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.color}`}>
              {badge.label}
            </span>
          )}
        </div>

        {/* Instancia del cruce — siempre visible una vez seleccionado torneo */}
        {tournamentId && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Instancia</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {RONDAS.filter((r) => r !== 'Otro…').map((r) => (
                <button
                  key={r} type="button"
                  onClick={() => setRondaSelect(r)}
                  className={`rounded-xl border-2 px-2 py-2.5 text-xs font-semibold transition-colors text-center ${
                    rondaSelect === r ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {r}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRondaSelect('Otro…')}
                className={`rounded-xl border-2 px-2 py-2.5 text-xs font-semibold transition-colors text-center ${
                  rondaSelect === 'Otro…' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Otro…
              </button>
            </div>
            {rondaSelect === 'Otro…' && (
              <input
                type="text" value={rondaCustom} onChange={(e) => setRondaCustom(e.target.value)}
                placeholder="Ej: 3er puesto, Repechaje…"
                className={inputCls}
                autoFocus
              />
            )}
          </div>
        )}

        {/* Equipos — todos los del torneo, sin filtrar por zona */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Local *</label>
            <select required value={homeClubId} onChange={(e) => setHomeClubId(e.target.value)} className={inputCls}>
              <option value="">— Local —</option>
              {availableClubs.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{clubLabel(c.id)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Visitante *</label>
            <select required value={awayClubId} onChange={(e) => setAwayClubId(e.target.value)} className={inputCls}>
              <option value="">— Visitante —</option>
              {availableClubs.filter((c) => c.id !== homeClubId).map((c) => (
                <option key={c.id} value={c.id}>{c.name}{clubLabel(c.id)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fecha, estadio */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Fecha y hora</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Estadio</label>
            <input type="text" value={stadium} onChange={(e) => setStadium(e.target.value)} placeholder="Ej. Estadio Municipal" className={inputCls} />
          </div>
        </div>

        {/* Árbitros */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">Árbitros</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Principal</label>
              <input type="text" value={referee} onChange={(e) => setReferee(e.target.value)} placeholder="Nombre" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">4° árbitro</label>
              <input type="text" value={refereeFourth} onChange={(e) => setRefereeFourth(e.target.value)} placeholder="Nombre" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Asistente 1</label>
              <input type="text" value={refereeAssistant1} onChange={(e) => setRefereeAssistant1(e.target.value)} placeholder="Nombre" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Asistente 2</label>
              <input type="text" value={refereeAssistant2} onChange={(e) => setRefereeAssistant2(e.target.value)} placeholder="Nombre" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Crear cruce'}</Button>
          <Button type="button" variant="secondary" onClick={() => router.push('/admin/partidos')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
