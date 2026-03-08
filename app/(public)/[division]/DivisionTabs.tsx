'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { StandingWithClub, TopScorer, MatchDateWithMatches } from '@/types';
import type { PlayerCardRecord } from '@/lib/queries/cards';
import { MatchRow } from '@/components/partidos/MatchRow';

const TABS = ['Tabla', 'Partidos', 'Equipos', 'Goleadores', 'Tarjetas'] as const;

interface Props {
  divisionSlug: string;
  standings: StandingWithClub[];
  scorers: TopScorer[];
  matchDates: MatchDateWithMatches[];
  cards: PlayerCardRecord[];
}

export function DivisionTabs({ divisionSlug, standings, scorers, matchDates, cards }: Props) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Tabla');
  const allMatches = matchDates.flatMap((d) => d.matches);

  return (
    <div>
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-border scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-accent text-accent'
                : 'text-secondary hover:text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-4 py-4">
        {activeTab === 'Tabla' && (
          standings.length === 0 ? (
            <p className="py-8 text-center text-sm text-secondary">Sin datos de tabla</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-secondary text-[10px] uppercase tracking-widest">
                    <th className="pb-2 text-left font-semibold w-6">#</th>
                    <th className="pb-2 text-left font-semibold">Club</th>
                    <th className="pb-2 text-center font-semibold w-8">PJ</th>
                    <th className="pb-2 text-center font-semibold w-8">G</th>
                    <th className="pb-2 text-center font-semibold w-8">E</th>
                    <th className="pb-2 text-center font-semibold w-8">P</th>
                    <th className="pb-2 text-center font-semibold w-8">DG</th>
                    <th className="pb-2 text-center font-semibold w-10 text-accent">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {standings.map((s, i) => (
                    <tr key={s.id} className="hover:bg-elevated/50 transition-colors">
                      <td className="py-2.5 text-xs text-secondary pr-2">{i + 1}</td>
                      <td className="py-2.5">
                        <Link href={`/clubes/${s.club.slug}`} className="flex items-center gap-2">
                          {s.club.logo_url ? (
                            <Image src={s.club.logo_url} alt={s.club.name} width={20} height={20}
                              className="rounded-full object-contain" />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-elevated text-[8px] flex items-center justify-center font-bold text-secondary">
                              {s.club.name.slice(0, 2)}
                            </div>
                          )}
                          <span className="text-sm font-semibold text-primary">{s.club.short_name || s.club.name}</span>
                        </Link>
                      </td>
                      <td className="py-2.5 text-center text-xs text-secondary">{s.played}</td>
                      <td className="py-2.5 text-center text-xs text-secondary">{s.won}</td>
                      <td className="py-2.5 text-center text-xs text-secondary">{s.drawn}</td>
                      <td className="py-2.5 text-center text-xs text-secondary">{s.lost}</td>
                      <td className="py-2.5 text-center text-xs text-secondary">{s.goal_difference > 0 ? `+${s.goal_difference}` : s.goal_difference}</td>
                      <td className="py-2.5 text-center text-sm font-bold text-accent">{s.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === 'Partidos' && (
          allMatches.length === 0 ? (
            <p className="py-8 text-center text-sm text-secondary">Sin partidos cargados</p>
          ) : (
            <div className="-mx-4 divide-y divide-border">
              {matchDates.map((dateGroup) => (
                dateGroup.matches.length > 0 && (
                  <div key={dateGroup.id}>
                    <div className="flex items-center gap-3 px-4 py-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
                        {dateGroup.label || `Fecha ${dateGroup.number}`}
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="divide-y divide-border">
                      {dateGroup.matches.map((m) => (
                        <MatchRow key={m.id} match={m} />
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )
        )}

        {activeTab === 'Equipos' && (
          standings.length === 0 ? (
            <p className="py-8 text-center text-sm text-secondary">Sin equipos</p>
          ) : (
            <div className="space-y-1">
              {standings.map((s) => (
                <Link key={s.id} href={`/clubes/${s.club.slug}`}
                  className="flex items-center gap-3 rounded-xl bg-card px-3 py-3 hover:bg-elevated transition-colors">
                  {s.club.logo_url ? (
                    <Image src={s.club.logo_url} alt={s.club.name} width={36} height={36}
                      className="h-9 w-9 rounded-full object-contain" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-elevated text-xs font-bold text-secondary">
                      {s.club.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-primary">{s.club.name}</span>
                </Link>
              ))}
            </div>
          )
        )}

        {activeTab === 'Goleadores' && (
          scorers.length === 0 ? (
            <p className="py-8 text-center text-sm text-secondary">Sin goleadores registrados</p>
          ) : (
            <div className="space-y-1">
              {scorers.map((s, i) => (
                <Link key={s.player_id} href={`/jugadores/${s.player_id}`}
                  className="flex items-center gap-3 rounded-xl bg-card px-3 py-3 hover:bg-elevated transition-colors">
                  <span className="w-5 text-center text-xs font-bold text-secondary">{i + 1}</span>
                  {s.photo_url ? (
                    <Image src={s.photo_url} alt={s.first_name} width={32} height={32}
                      className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-xs font-bold text-secondary">
                      {s.first_name[0]}{s.last_name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary">{s.first_name} {s.last_name}</p>
                    <p className="text-xs text-secondary">{s.club_name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-black text-accent">{s.goals}</span>
                    <span className="text-xs text-secondary">⚽</span>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {activeTab === 'Tarjetas' && (
          cards.length === 0 ? (
            <p className="py-8 text-center text-sm text-secondary">Sin tarjetas registradas</p>
          ) : (
            <div className="space-y-1">
              {cards.map((c) => (
                <Link key={c.player_id} href={`/jugadores/${c.player_id}`}
                  className="flex items-center gap-3 rounded-xl bg-card px-3 py-3 hover:bg-elevated transition-colors">
                  {c.photo_url ? (
                    <Image src={c.photo_url} alt={c.first_name} width={32} height={32}
                      className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-xs font-bold text-secondary">
                      {c.first_name[0]}{c.last_name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary">{c.first_name} {c.last_name}</p>
                    <p className="text-xs text-secondary">{c.club_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.yellow_cards > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="inline-block h-3 w-2.5 rounded-sm bg-yellow-400" />
                        <span className="text-xs font-bold text-primary">{c.yellow_cards}</span>
                      </div>
                    )}
                    {(c.red_cards + c.second_yellows) > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="inline-block h-3 w-2.5 rounded-sm bg-red-500" />
                        <span className="text-xs font-bold text-primary">{c.red_cards + c.second_yellows}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
