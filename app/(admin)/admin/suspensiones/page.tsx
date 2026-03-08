import Image from 'next/image';
import { getTournaments } from '@/lib/queries/tournaments';
import { getSuspendedPlayers, getPlayerCards } from '@/lib/queries/suspensions';

export const revalidate = 0;

export default async function SuspensionesPage() {
  const tournaments = await getTournaments();

  if (tournaments.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400">
        No hay torneos activos
      </div>
    );
  }

  // Calcular suspensiones para todos los torneos activos
  const allData = await Promise.all(
    tournaments.map(async (t) => {
      const [suspensions, cards] = await Promise.all([
        getSuspendedPlayers(t.id),
        getPlayerCards(t.id),
      ]);
      return { tournament: t, suspensions, cards };
    }),
  );

  const pendingSuspensions = allData.flatMap((d) =>
    d.suspensions.filter((s) => !s.served).map((s) => ({ ...s, tournamentName: d.tournament.name, divisionLabel: d.tournament.division.label })),
  );
  const servedSuspensions = allData.flatMap((d) =>
    d.suspensions.filter((s) => s.served).map((s) => ({ ...s, tournamentName: d.tournament.name, divisionLabel: d.tournament.division.label })),
  );
  const allCards = allData.flatMap((d) =>
    d.cards.map((c) => ({ ...c, divisionLabel: d.tournament.division.label })),
  );

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Suspensiones y Disciplina</h1>
        <p className="mt-1 text-sm text-slate-500">
          Roja = 1 partido · Doble amarilla = 1 partido · 5 amarillas = 1 partido
        </p>
      </div>

      {/* Suspendidos pendientes */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-800">Suspendidos</h2>
          {pendingSuspensions.length > 0 && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
              {pendingSuspensions.length}
            </span>
          )}
        </div>

        {pendingSuspensions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-400">
            No hay jugadores suspendidos pendientes
          </div>
        ) : (
          <div className="space-y-2">
            {pendingSuspensions.map((s, i) => (
              <div
                key={`${s.player_id}-${s.card_match_date}-${i}`}
                className="flex items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-4"
              >
                {s.photo_url ? (
                  <Image src={s.photo_url} alt={s.first_name} width={44} height={44}
                    className="h-11 w-11 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-red-200 text-sm font-bold text-red-700">
                    {s.first_name[0]}{s.last_name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">
                    {s.last_name}, {s.first_name}
                  </p>
                  <p className="text-sm text-slate-500">{s.club_name} · {s.divisionLabel}</p>
                  <p className="mt-0.5 text-xs font-medium text-red-600">{s.reason}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-500">Recibida en</p>
                  <p className="text-sm font-bold text-slate-800">Fecha {s.card_match_date}</p>
                  <p className="text-xs text-red-600 font-semibold">Suspendido Fecha {s.suspended_for_date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Ya cumplidas */}
      {servedSuspensions.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-slate-800 text-opacity-60">
            Suspensiones ya cumplidas
          </h2>
          <div className="space-y-2">
            {servedSuspensions.slice(0, 10).map((s, i) => (
              <div
                key={`served-${s.player_id}-${s.card_match_date}-${i}`}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 opacity-60"
              >
                {s.photo_url ? (
                  <Image src={s.photo_url} alt={s.first_name} width={40} height={40}
                    className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-500">
                    {s.first_name[0]}{s.last_name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700">
                    {s.last_name}, {s.first_name}
                  </p>
                  <p className="text-xs text-slate-400">{s.club_name} · {s.reason}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  Cumplida
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tabla de tarjetas por jugador */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-800">Tarjetas por jugador</h2>
        {allCards.length === 0 ? (
          <p className="text-sm text-slate-400">Sin tarjetas registradas</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-left">Jugador</th>
                  <th className="px-4 py-3 text-left">Club</th>
                  <th className="px-4 py-3 text-center">🟨</th>
                  <th className="px-4 py-3 text-center">🟨🟥</th>
                  <th className="px-4 py-3 text-center">🟥</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allCards.map((c) => (
                  <tr key={`${c.player_id}-${c.divisionLabel}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {c.photo_url ? (
                          <Image src={c.photo_url} alt={c.first_name} width={28} height={28}
                            className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-slate-200" />
                        )}
                        <div>
                          <p className="font-medium text-slate-800">{c.last_name}, {c.first_name}</p>
                          <p className="text-xs text-slate-400">{c.divisionLabel}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.club_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${c.yellow_cards >= 5 ? 'text-red-600' : c.yellow_cards >= 4 ? 'text-yellow-600' : 'text-slate-700'}`}>
                        {c.yellow_cards}
                        {c.yellow_cards >= 5 && <span className="ml-1 text-xs">⚠️</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">{c.second_yellows}</td>
                    <td className="px-4 py-3 text-center font-bold text-red-600">{c.red_cards}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
