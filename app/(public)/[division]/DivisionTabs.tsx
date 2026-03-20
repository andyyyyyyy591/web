'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlayerPhoto } from '@/components/ui/PlayerPhoto';
import type { StandingWithClub, TopScorer, MatchDateWithMatches } from '@/types';
import type { TournamentClubWithClub } from '@/lib/queries/tournament-clubs';
import { MatchRow } from '@/components/partidos/MatchRow';

const TABS = ['Tabla', 'Partidos', 'Goleadores'] as const;

interface Props {
  divisionSlug: string;
  standings: StandingWithClub[];
  scorers: TopScorer[];
  matchDates: MatchDateWithMatches[];
  tournamentClubs: TournamentClubWithClub[];
  initialTab?: typeof TABS[number];
}

function ClubLogo({ url, name, size = 20 }: { url: string | null; name: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  if (url && !imgError) return (
    <Image src={url} alt={name} width={size} height={size}
      className="rounded-full object-contain flex-shrink-0" style={{ width: size, height: size }}
      onError={() => setImgError(true)} />
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

export function DivisionTabs({ divisionSlug, standings, scorers, matchDates, tournamentClubs, initialTab }: Props) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>(
    initialTab && TABS.includes(initialTab as typeof TABS[number]) ? (initialTab as typeof TABS[number]) : 'Tabla'
  );
  const allMatches = matchDates.flatMap((d) => d.matches);

  // Detect if this tournament uses zones
  const hasZones = tournamentClubs.some((tc) => tc.zone);

  const standingsZoneA = standings.filter((s) => s.zone === 'A');
  const standingsZoneB = standings.filter((s) => s.zone === 'B');
  const standingsNoZone = standings.filter((s) => !s.zone);

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
                  <PlayerPhoto url={s.photo_url} firstName={s.first_name} lastName={s.last_name} size={32} />
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

      </div>
    </div>
  );
}
