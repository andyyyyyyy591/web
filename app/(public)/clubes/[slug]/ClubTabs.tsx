'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { StandingWithClub, MatchWithClubs, News, Division } from '@/types';
import type { Trophy, TransferWithPlayer } from '@/types';
import type { PlayerWithDivision } from '@/lib/queries/players';
import { MatchRow } from '@/components/partidos/MatchRow';

const TABS = ['Resumen', 'Plantel', 'Partidos', 'Tabla', 'Fichajes', 'Noticias', 'Trofeos'] as const;

function StandingsGroup({ rows, clubId }: { rows: StandingWithClub[]; clubId: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-secondary text-[10px] uppercase tracking-widest">
            <th className="pb-2 text-left w-6">#</th>
            <th className="pb-2 text-left">Club</th>
            <th className="pb-2 text-center w-8">PJ</th>
            <th className="pb-2 text-center w-8">G</th>
            <th className="pb-2 text-center w-8">E</th>
            <th className="pb-2 text-center w-8">P</th>
            <th className="pb-2 text-center w-10 text-accent">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((s, i) => (
            <tr key={s.id} className={`transition-colors ${s.club_id === clubId ? 'bg-accent/10' : 'hover:bg-elevated/50'}`}>
              <td className="py-2.5 text-xs text-secondary pr-2">{i + 1}</td>
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  {s.club.logo_url ? (
                    <Image src={s.club.logo_url} alt={s.club.name} width={18} height={18}
                      className="rounded-full object-contain" />
                  ) : (
                    <div className="h-[18px] w-[18px] rounded-full bg-elevated" />
                  )}
                  <span className={`text-sm font-semibold ${s.club_id === clubId ? 'text-accent' : 'text-primary'}`}>
                    {s.club.short_name || s.club.name}
                  </span>
                </div>
              </td>
              <td className="py-2.5 text-center text-xs text-secondary">{s.played}</td>
              <td className="py-2.5 text-center text-xs text-secondary">{s.won}</td>
              <td className="py-2.5 text-center text-xs text-secondary">{s.drawn}</td>
              <td className="py-2.5 text-center text-xs text-secondary">{s.lost}</td>
              <td className="py-2.5 text-center text-sm font-bold text-accent">{s.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface Props {
  clubId: string;
  matches: MatchWithClubs[];
  standings: StandingWithClub[];
  transfers: TransferWithPlayer[];
  trophies: Trophy[];
  news: News[];
  players: PlayerWithDivision[];
  divisions: Division[];
}

export function ClubTabs({ clubId, matches, standings, transfers, trophies, news, players, divisions }: Props) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Resumen');

  // Determine which divisions have players for this club
  const divisionsWithPlayers = divisions.filter((d) =>
    players.some((p) => p.primary_division_id === d.id),
  );
  // Default to primera (or first division with players)
  const primeraDiv = divisions.find((d) => d.slug === 'primera');
  const defaultDivisionId =
    (primeraDiv && divisionsWithPlayers.some((d) => d.id === primeraDiv.id)
      ? primeraDiv.id
      : divisionsWithPlayers[0]?.id) ?? '';
  const [activeDivisionId, setActiveDivisionId] = useState(defaultDivisionId);

  const upcoming = matches.filter((m) => m.status === 'scheduled').slice(0, 3);
  const recent = matches.filter((m) => m.status === 'finished' && m.tournament.division.slug === 'primera').slice(0, 5);
  const clubStanding = standings.find((s) => s.club_id === clubId);
  const clubZone = clubStanding?.zone ?? null;
  // Para torneos de zonas, calcular posición solo dentro de la zona del club
  const zoneStandings = clubZone ? standings.filter((s) => s.zone === clubZone) : standings;
  const clubPosition = zoneStandings.findIndex((s) => s.club_id === clubId) + 1;

  // Para el tab Tabla: separar por zonas si corresponde
  const hasZones = standings.some((s) => s.zone);
  const standingsZoneA = standings.filter((s) => s.zone === 'A');
  const standingsZoneB = standings.filter((s) => s.zone === 'B');

  const incoming = transfers.filter((t) => t.type === 'in');
  const outgoing = transfers.filter((t) => t.type === 'out');

  return (
    <div>
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-border scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
              activeTab === tab ? 'border-b-2 border-accent text-accent' : 'text-secondary hover:text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        {activeTab === 'Resumen' && (
          <div className="space-y-4">
            {/* Position in table */}
            {clubStanding && (
              <div className="rounded-2xl bg-card p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-3">Posición en tabla</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-4xl font-black text-accent">
                      {clubPosition}°
                    </span>
                    <span className="ml-2 text-sm text-secondary">
                      {clubZone ? `Zona ${clubZone}` : 'posición'}
                    </span>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-xs text-secondary">{clubStanding.played} PJ · {clubStanding.points} Pts</p>
                    <p className="text-xs text-secondary">{clubStanding.won}G {clubStanding.drawn}E {clubStanding.lost}P</p>
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">Próximo partido</p>
                <div className="-mx-4 border-t border-border">
                  <MatchRow match={upcoming[0]} />
                </div>
              </div>
            )}

            {/* Recent results */}
            {recent.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">Últimos resultados</p>
                <div className="-mx-4 divide-y divide-border border-t border-border">
                  {recent.map((m) => {
                    const isHome = m.home_club_id === clubId;
                    const myScore = isHome ? m.home_score : m.away_score;
                    const theirScore = isHome ? m.away_score : m.home_score;
                    const result = myScore != null && theirScore != null
                      ? myScore > theirScore ? 'G' : myScore < theirScore ? 'P' : 'E'
                      : null;
                    const badgeColor: Record<string, string> = { G: 'bg-green-500', P: 'bg-red-500', E: 'bg-yellow-500' };
                    const badge = result ? badgeColor[result] : '';
                    return (
                      <div key={m.id} className="flex items-center">
                        <div className="flex-shrink-0 pl-4 pr-2">
                          {result
                            ? <span className={`flex h-5 w-5 items-center justify-center rounded-sm text-[9px] font-black text-white ${badge}`}>{result}</span>
                            : <span className="h-5 w-5" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <MatchRow match={m} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick plantel preview (primera only) */}
            {players.filter((p) => p.primary_division_id === primeraDiv?.id).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Plantel — Primera</p>
                  <button onClick={() => setActiveTab('Plantel')} className="text-[10px] font-semibold text-accent">Ver todo →</button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {players.filter((p) => p.primary_division_id === primeraDiv?.id).slice(0, 6).map((p) => (
                    <Link key={p.id} href={`/jugadores/${p.id}`}
                      className="flex items-center gap-2 rounded-xl bg-card px-3 py-2.5 hover:bg-elevated transition-colors">
                      {p.photo_url ? (
                        <Image src={p.photo_url} alt={p.first_name} width={28} height={28}
                          className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-elevated text-[9px] font-bold text-secondary">
                          {p.first_name[0]}{p.last_name[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-primary truncate">{p.first_name} {p.last_name}</p>
                        {p.jersey_number != null && (
                          <p className="text-[10px] text-secondary">#{p.jersey_number}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Plantel' && (
          <div className="space-y-4">
            {players.length === 0 ? (
              <p className="py-8 text-center text-sm text-secondary">Sin jugadores registrados</p>
            ) : (
              <>
                {/* Division selector */}
                {divisionsWithPlayers.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {divisionsWithPlayers.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setActiveDivisionId(d.id)}
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                          activeDivisionId === d.id
                            ? 'bg-accent text-white'
                            : 'bg-elevated text-secondary hover:text-primary'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Player grid */}
                {(() => {
                  const divPlayers = players.filter((p) => p.primary_division_id === activeDivisionId);
                  if (divPlayers.length === 0) {
                    return <p className="py-6 text-center text-sm text-secondary">Sin jugadores en esta categoría</p>;
                  }
                  return (
                    <div className="grid grid-cols-2 gap-1.5">
                      {divPlayers.map((p) => (
                        <Link key={p.id} href={`/jugadores/${p.id}`}
                          className="flex items-center gap-2 rounded-xl bg-card px-3 py-2.5 hover:bg-elevated transition-colors">
                          {p.photo_url ? (
                            <Image src={p.photo_url} alt={p.first_name} width={32} height={32}
                              className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-elevated text-[10px] font-bold text-secondary">
                              {p.first_name[0]}{p.last_name[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-primary truncate">{p.last_name} {p.first_name}</p>
                            {p.jersey_number != null && (
                              <p className="text-[10px] text-secondary">#{p.jersey_number}</p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {activeTab === 'Partidos' && (
          matches.length === 0 ? (
            <p className="py-8 text-center text-sm text-secondary">Sin partidos registrados</p>
          ) : (
            <div className="-mx-4 divide-y divide-border">
              {matches.map((m) => <MatchRow key={m.id} match={m} />)}
            </div>
          )
        )}

        {activeTab === 'Tabla' && (
          standings.length === 0 ? (
            <p className="py-8 text-center text-sm text-secondary">Sin datos de tabla</p>
          ) : hasZones ? (
            <div className="space-y-6">
              {[{ label: 'Zona A', rows: standingsZoneA }, { label: 'Zona B', rows: standingsZoneB }].map(({ label, rows }) =>
                rows.length === 0 ? null : (
                  <div key={label}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-accent">{label}</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <StandingsGroup rows={rows} clubId={clubId} />
                  </div>
                )
              )}
            </div>
          ) : (
            <StandingsGroup rows={standings} clubId={clubId} />
          )
        )}

        {activeTab === 'Fichajes' && (
          transfers.length === 0 ? (
            <p className="py-8 text-center text-sm text-secondary">Sin fichajes registrados</p>
          ) : (
            <div className="space-y-4">
              {incoming.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">Altas</p>
                  <div className="space-y-1">
                    {incoming.map((t) => (
                      <Link key={t.id} href={`/jugadores/${t.player_id}`}
                        className="flex items-center gap-3 rounded-xl bg-card px-3 py-3 hover:bg-elevated transition-colors">
                        {t.player.photo_url ? (
                          <Image src={t.player.photo_url} alt={t.player.first_name} width={32} height={32}
                            className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-xs font-bold text-secondary">
                            {t.player.first_name[0]}{t.player.last_name[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">{t.player.first_name} {t.player.last_name}</p>
                          {t.notes && <p className="text-xs text-secondary">{t.notes}</p>}
                        </div>
                        <span className="text-xs font-bold text-accent">↓ Alta</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {outgoing.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">Bajas</p>
                  <div className="space-y-1">
                    {outgoing.map((t) => (
                      <Link key={t.id} href={`/jugadores/${t.player_id}`}
                        className="flex items-center gap-3 rounded-xl bg-card px-3 py-3 hover:bg-elevated transition-colors">
                        {t.player.photo_url ? (
                          <Image src={t.player.photo_url} alt={t.player.first_name} width={32} height={32}
                            className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-xs font-bold text-secondary">
                            {t.player.first_name[0]}{t.player.last_name[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-secondary">{t.player.first_name} {t.player.last_name}</p>
                          {t.notes && <p className="text-xs text-secondary">{t.notes}</p>}
                        </div>
                        <span className="text-xs font-bold text-secondary">↑ Baja</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {activeTab === 'Noticias' && (
          news.length === 0 ? (
            <p className="py-8 text-center text-sm text-secondary">Sin noticias relacionadas</p>
          ) : (
            <div className="space-y-1">
              {news.map((item) => (
                <Link key={item.id} href={`/noticias/${item.slug}`}
                  className="flex items-center gap-3 rounded-xl bg-card px-3 py-3 hover:bg-elevated transition-colors">
                  {item.image_url && (
                    <Image src={item.image_url} alt={item.title} width={40} height={40}
                      className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary line-clamp-2 leading-tight">{item.title}</p>
                    <p className="text-[11px] text-secondary mt-0.5">{formatDate(item.published_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {activeTab === 'Trofeos' && (
          trophies.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-4xl">🏆</p>
              <p className="mt-3 text-sm text-secondary">Todavía no hay trofeos cargados.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trophies.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl bg-card px-4 py-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="text-sm font-bold text-primary">{t.name}</p>
                    {t.year && <p className="text-xs text-secondary">{t.year}</p>}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
