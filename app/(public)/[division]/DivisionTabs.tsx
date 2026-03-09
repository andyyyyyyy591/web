'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { StandingWithClub, TopScorer, MatchDateWithMatches } from '@/types';
import type { PlayerCardRecord } from '@/lib/queries/cards';
import type { TournamentClubWithClub } from '@/lib/queries/tournament-clubs';
import { MatchRow } from '@/components/partidos/MatchRow';

const TABS = ['Tabla', 'Partidos', 'Goleadores', 'Tarjetas'] as const;

interface Props {
  divisionSlug: string;
  standings: StandingWithClub[];
  scorers: TopScorer[];
  matchDates: MatchDateWithMatches[];
  cards: PlayerCardRecord[];
  tournamentClubs: TournamentClubWithClub[];
}

function ClubLogo({ url, name, size = 20 }: { url: string | null; name: string; size?: number }) {
  if (url) return (
    <Image src={url} alt={name} width={size} height={size}
      className="rounded-full object-contain flex-shrink-0" style={{ width: size, height: size }} />
  );
  return (
    <div className="flex items-center justify-center rounded-full bg-elevated font-bold text-secondary flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function StandingsTable({ rows, title }: { rows: StandingWithClub[]; title?: string }) {
  if (rows.length === 0) return null;
  return (
    <div>
      {title && (
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-accent">{title}</span>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}
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
            {rows.map((s, i) => (
              <tr key={s.id} className="hover:bg-elevated/50 transition-colors">
                <td className="py-2.5 text-xs text-secondary pr-2">{i + 1}</td>
                <td className="py-2.5">
                  <Link href={`/clubes/${s.club.slug}`} className="flex items-center gap-2">
                    <ClubLogo url={s.club.logo_url} name={s.club.name} />
                    <span
                      className="text-sm font-semibold text-primary"
                      title={s.club.short_name ? s.club.name : undefined}
                    >
                      {s.club.short_name || s.club.name}
                    </span>
                  </Link>
                </td>
                <td className="py-2.5 text-center text-xs text-secondary">{s.played}</td>
                <td className="py-2.5 text-center text-xs text-secondary">{s.won}</td>
                <td className="py-2.5 text-center text-xs text-secondary">{s.drawn}</td>
                <td className="py-2.5 text-center text-xs text-secondary">{s.lost}</td>
                <td className="py-2.5 text-center text-xs text-secondary">
                  {s.goal_difference > 0 ? `+${s.goal_difference}` : s.goal_difference}
                </td>
                <td className="py-2.5 text-center text-sm font-bold text-accent">{s.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DivisionTabs({ divisionSlug, standings, scorers, matchDates, cards, tournamentClubs }: Props) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Tabla');
  const allMatches = matchDates.flatMap((d) => d.matches);

  // Detect if this tournament uses zones
  const hasZones = tournamentClubs.some((tc) => tc.zone);
  const zones = hasZones ? ['A', 'B'] : [null];

  const standingsZoneA = standings.filter((s) => s.zone === 'A');
  const standingsZoneB = standings.filter((s) => s.zone === 'B');
  const standingsNoZone = standings.filter((s) => !s.zone);
  const clubsZoneA = tournamentClubs.filter((tc) => tc.zone === 'A');
  const clubsZoneB = tournamentClubs.filter((tc) => tc.zone === 'B');
  const clubsNoZone = tournamentClubs.filter((tc) => !tc.zone);

  return (
    <div>
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-border" style={{ scrollbarWidth: 'none' }}>
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

        {/* ── TABLA ── */}
        {activeTab === 'Tabla' && (
          standings.length === 0 ? (
            <p className="py-8 text-center text-sm text-secondary">Sin datos de tabla aún</p>
          ) : hasZones ? (
            <div className="space-y-6">
              {standingsZoneA.length > 0 && <StandingsTable rows={standingsZoneA} title="Zona A" />}
              {standingsZoneB.length > 0 && <StandingsTable rows={standingsZoneB} title="Zona B" />}
              {standingsNoZone.length > 0 && <StandingsTable rows={standingsNoZone} />}
            </div>
          ) : (
            <StandingsTable rows={standings} />
          )
        )}

        {/* ── PARTIDOS ── */}
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

        {/* ── GOLEADORES ── */}
        {activeTab === 'Goleadores' && (
          scorers.length === 0 ? (
            <p className="py-8 text-center text-sm text-secondary">Sin goleadores registrados</p>
          ) : (
            <div className="space-y-1">
              {scorers.map((s, i) => (
                <Link key={s.player_id} href={`/jugadores/${s.player_id}`}
                  className="flex items-center gap-3 rounded-xl bg-card px-3 py-3 hover:bg-elevated transition-colors border border-border">
                  <span className="w-5 text-center text-xs font-bold text-secondary">{i + 1}</span>
                  {s.photo_url ? (
                    <Image src={s.photo_url} alt={s.first_name} width={32} height={32}
                      className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-xs font-bold text-secondary flex-shrink-0">
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

        {/* ── TARJETAS ── */}
        {activeTab === 'Tarjetas' && (
          cards.length === 0 ? (
            <p className="py-8 text-center text-sm text-secondary">Sin tarjetas registradas</p>
          ) : (
            <div className="space-y-1">
              {cards.map((c) => (
                <Link key={c.player_id} href={`/jugadores/${c.player_id}`}
                  className="flex items-center gap-3 rounded-xl bg-card px-3 py-3 hover:bg-elevated transition-colors border border-border">
                  {c.photo_url ? (
                    <Image src={c.photo_url} alt={c.first_name} width={32} height={32}
                      className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-xs font-bold text-secondary flex-shrink-0">
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
                        <span className="inline-block h-3.5 w-2.5 rounded-sm bg-yellow-400" />
                        <span className="text-xs font-bold text-primary">{c.yellow_cards}</span>
                      </div>
                    )}
                    {(c.red_cards + c.second_yellows) > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="inline-block h-3.5 w-2.5 rounded-sm bg-red-500" />
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
