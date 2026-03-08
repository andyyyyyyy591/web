'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { StandingWithClub, MatchWithClubs, News } from '@/types';
import type { Trophy, TransferWithPlayer } from '@/types';
import type { Player } from '@/types';
import { POSITION_LABELS } from '@/types';
import { MatchRow } from '@/components/partidos/MatchRow';

const TABS = ['Resumen', 'Partidos', 'Tabla', 'Fichajes', 'Noticias', 'Trofeos'] as const;

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
  players: Player[];
}

export function ClubTabs({ clubId, matches, standings, transfers, trophies, news, players }: Props) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Resumen');

  const upcoming = matches.filter((m) => m.status === 'scheduled').slice(0, 3);
  const recent = matches.filter((m) => m.status === 'finished').slice(0, 5);
  const clubStanding = standings.find((s) => s.club_id === clubId);

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
                      {standings.findIndex((s) => s.club_id === clubId) + 1}°
                    </span>
                    <span className="ml-2 text-sm text-secondary">posición</span>
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
                  {recent.map((m) => <MatchRow key={m.id} match={m} />)}
                </div>
              </div>
            )}

            {/* Players with plays_in_primera */}
            {players.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">Plantel — Primera</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {players.map((p) => (
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
          ) : (
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
                  {standings.map((s, i) => (
                    <tr key={s.id} className={`transition-colors ${s.club_id === clubId ? 'bg-accent/10' : 'hover:bg-elevated/50'}`}>
                      <td className="py-2.5 text-xs text-secondary pr-2">{i + 1}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          {s.club.logo_url ? (
                            <Image src={s.club.logo_url} alt={s.club.name} width={18} height={18}
                              className="rounded-full object-contain" />
                          ) : (
                            <div className="h-4.5 w-4.5 rounded-full bg-elevated" />
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
