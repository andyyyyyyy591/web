import Link from 'next/link';
import { requireSuperAdmin } from '@/lib/utils/admin-guard';
import { getSeasonsWithTournaments } from '@/lib/queries/tournaments';

export default async function TorneosPage() {
  await requireSuperAdmin();
  const seasons = await getSeasonsWithTournaments();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Torneos</h1>
      <p className="text-sm text-slate-500">
        Seleccioná un torneo para gestionar los equipos participantes y sus zonas.
      </p>

      {seasons.length === 0 && (
        <p className="text-sm text-slate-400">No hay temporadas. Creá una primero en <Link href="/admin/temporadas" className="text-green-600 underline">Temporadas</Link>.</p>
      )}

      {seasons.map((season) => (
        <div key={season.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="font-semibold text-slate-800 mb-3">{season.name} ({season.year})</p>
          {season.tournaments.length === 0 ? (
            <p className="text-xs text-slate-400">Sin torneos creados</p>
          ) : (
            <div className="space-y-1">
              {season.tournaments.map((t) => (
                <Link
                  key={t.id}
                  href={`/admin/torneos/${t.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm font-medium text-slate-700">
                    {t.division?.name ?? t.name}
                  </span>
                  <span className="text-xs text-green-600 font-semibold">Gestionar equipos →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
