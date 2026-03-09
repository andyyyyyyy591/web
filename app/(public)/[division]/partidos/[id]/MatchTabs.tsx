'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { MatchDetail } from '@/types';
import { MatchTimeline } from '@/components/match/MatchTimeline';
import { Formation } from '@/components/match/Formation';
import { MatchLineup } from '@/components/match/MatchLineup';
import { LiveClock } from '@/components/match/LiveClock';
import { isLive, STATUS_LABELS, GOAL_TYPES } from '@/types';
import type { MatchStaffEntry } from '@/lib/queries/coaching-staff';

const TABS = ['Previa', 'Alineación', 'Directo'] as const;

function formatDateTime(dt: string | null) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('es-AR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatTime(dt: string | null) {
  if (!dt) return '—';
  return new Date(dt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function ClubLogo({ url, name, size = 56 }: { url: string | null; name: string; size?: number }) {
  if (url) {
    return (
      <Image src={url} alt={name} width={size} height={size}
        className="object-contain" style={{ width: size, height: size }} />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-elevated font-bold text-secondary"
      style={{ width: size, height: size, fontSize: size * 0.33 }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

interface SuspendedEntry {
  player_id: string;
  first_name: string;
  last_name: string;
}

interface Props {
  match: MatchDetail;
  homePosition?: number;
  awayPosition?: number;
  homeSuspended?: SuspendedEntry[];
  awaySuspended?: SuspendedEntry[];
  matchStaff?: MatchStaffEntry[];
}

export function MatchTabs({ match, homePosition, awayPosition, homeSuspended, awaySuspended, matchStaff }: Props) {
  const homeStaff = matchStaff?.filter((s) => s.club_id === match.home_club_id).map((s) => s.staff);
  const awayStaff = matchStaff?.filter((s) => s.club_id === match.away_club_id).map((s) => s.staff);
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Previa');
  const live = isLive(match.status);
  const finished = match.status === 'finished';
  const hasLineup = match.home_starters.length > 0 || match.away_starters.length > 0;

  return (
    <div className="flex flex-col">
      {/* Match header */}
      <div className="bg-elevated px-4 pb-5 pt-3">
        {/* Division + status */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-secondary">
            {match.tournament.division.label}
          </span>
          {live ? (
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-live animate-pulse" />
              <span className="text-xs font-bold text-live">{STATUS_LABELS[match.status]}</span>
            </div>
          ) : (
            <span className="text-xs font-semibold text-secondary">{STATUS_LABELS[match.status]}</span>
          )}
        </div>

        {/* Score row */}
        <div className="flex items-center justify-between gap-2">
          {/* Home */}
          <div className="flex flex-1 flex-col items-center gap-2">
            <ClubLogo url={match.home_club.logo_url} name={match.home_club.name} />
            <span className="text-center text-sm font-semibold text-primary leading-tight">
              {match.home_club.name}
            </span>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-1">
            {(live || finished) ? (
              <span className="text-4xl font-black text-primary tabular-nums">
                {match.home_score} – {match.away_score}
              </span>
            ) : (
              <span className="text-2xl font-bold text-secondary">
                {formatTime(match.scheduled_at)}
              </span>
            )}
            {live && <LiveClock match={match} />}
            {match.penalty_winner_club_id && (() => {
              const winnerClub = match.penalty_winner_club_id === match.home_club_id
                ? match.home_club : match.away_club;
              const homeGoals = match.events.filter(
                (e) => e.period === 'penalties' && e.club_id === match.home_club_id && GOAL_TYPES.includes(e.type as never),
              ).length;
              const awayGoals = match.events.filter(
                (e) => e.period === 'penalties' && e.club_id === match.away_club_id && GOAL_TYPES.includes(e.type as never),
              ).length;
              const hasPenaltyScore = match.events.some((e) => e.period === 'penalties');
              return (
                <span className="text-[11px] font-bold text-accent text-center">
                  {hasPenaltyScore
                    ? `${winnerClub.short_name ?? winnerClub.name} ganó ${homeGoals}–${awayGoals} en penales`
                    : `${winnerClub.short_name ?? winnerClub.name} ganó por penales`}
                </span>
              );
            })()}
          </div>

          {/* Away */}
          <div className="flex flex-1 flex-col items-center gap-2">
            <ClubLogo url={match.away_club.logo_url} name={match.away_club.name} />
            <span className="text-center text-sm font-semibold text-primary leading-tight">
              {match.away_club.name}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
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
        {activeTab === 'Previa' && (
          <div className="space-y-3">
            {(homePosition || awayPosition) && (
              <div className="rounded-xl bg-elevated px-4 py-3">
                <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-secondary">Posición en la tabla</p>
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <p className="text-2xl font-black text-accent">{homePosition ? `${homePosition}°` : '—'}</p>
                    <p className="mt-1 text-xs text-secondary">{match.home_club.name}</p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center">
                    <p className="text-2xl font-black text-accent">{awayPosition ? `${awayPosition}°` : '—'}</p>
                    <p className="mt-1 text-xs text-secondary">{match.away_club.name}</p>
                  </div>
                </div>
              </div>
            )}
            {match.scheduled_at && (
              <InfoRow label="Fecha y hora" value={formatDateTime(match.scheduled_at)} />
            )}
            {match.stadium && (
              <InfoRow label="Estadio" value={match.stadium} />
            )}
            {match.referee && (
              <InfoRow label="Árbitro" value={match.referee} />
            )}
            {match.referee_assistant_1 && (
              <InfoRow label="Asistente 1" value={match.referee_assistant_1} />
            )}
            {match.referee_assistant_2 && (
              <InfoRow label="Asistente 2" value={match.referee_assistant_2} />
            )}
            {match.notes && (
              <InfoRow label="Notas" value={match.notes} />
            )}
            {!match.scheduled_at && !match.stadium && !match.referee && (
              <p className="py-8 text-center text-sm text-secondary">No hay información disponible</p>
            )}
          </div>
        )}

        {activeTab === 'Alineación' && (
          !hasLineup ? (
            <p className="py-8 text-center text-sm text-secondary">
              Todavía no está disponible la alineación.
            </p>
          ) : (
            <div className="space-y-6">
              {(match.home_starters.length > 0 || match.away_starters.length > 0) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {match.home_starters.length > 0 && (
                    <Formation starters={match.home_starters} label={match.home_club.name} />
                  )}
                  {match.away_starters.length > 0 && (
                    <Formation starters={match.away_starters} label={match.away_club.name} />
                  )}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <MatchLineup
                  starters={match.home_starters}
                  subs={match.home_subs}
                  clubName={match.home_club.name}
                  suspended={homeSuspended}
                  staff={homeStaff}
                />
                <MatchLineup
                  starters={match.away_starters}
                  subs={match.away_subs}
                  clubName={match.away_club.name}
                  suspended={awaySuspended}
                  staff={awayStaff}
                />
              </div>
            </div>
          )
        )}

        {activeTab === 'Directo' && (
          <MatchTimeline
            events={match.events}
            homeClubId={match.home_club_id}
            status={match.status}
            firstHalfAddedTime={match.first_half_added_time}
            secondHalfAddedTime={match.second_half_added_time}
          />
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-elevated px-4 py-3">
      <span className="text-xs font-semibold text-secondary shrink-0">{label}</span>
      <span className="text-sm text-primary text-right capitalize">{value}</span>
    </div>
  );
}
