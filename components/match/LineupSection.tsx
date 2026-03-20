'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { MatchLineupWithPlayer, CoachingStaff } from '@/types';
import { FullPitchFormation } from './FullPitchFormation';
import { formatPlayerName } from '@/lib/utils/format';

interface SuspendedEntry {
  player_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  reason: string;
}

interface InjuredEntry {
  player_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  description: string;
  estimated_recovery: string | null;
}

interface Props {
  homeStarters: MatchLineupWithPlayer[];
  awayStarters: MatchLineupWithPlayer[];
  homeSubs: MatchLineupWithPlayer[];
  awaySubs: MatchLineupWithPlayer[];
  homeClubName: string;
  awayClubName: string;
  homeStaff?: CoachingStaff[];
  awayStaff?: CoachingStaff[];
  homeSuspended?: SuspendedEntry[];
  awaySuspended?: SuspendedEntry[];
  homeInjured?: InjuredEntry[];
  awayInjured?: InjuredEntry[];
}

function PlayerAvatar({ photo, firstName, lastName }: { photo: string | null; firstName: string; lastName: string }) {
  const [imgError, setImgError] = useState(false);
  if (photo && !imgError) {
    return (
      <Image
        src={photo}
        alt={`${firstName} ${lastName}`}
        width={32}
        height={32}
        className="h-8 w-8 rounded-full object-cover"
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div className="h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center">
      <span className="text-[10px] font-bold text-secondary">
        {firstName.slice(0, 1)}{lastName.slice(0, 1)}
      </span>
    </div>
  );
}

/** Tarjeta roja (rectángulo) */
function RedCardBadge() {
  return (
    <div className="absolute -bottom-0.5 -right-0.5 h-[13px] w-[9px] rounded-[2px] bg-red-600 border border-white/70 shadow-sm" />
  );
}

/** Cruz médica (círculo blanco con +) */
function MedicalBadge() {
  return (
    <div className="absolute -bottom-0.5 -right-0.5 h-[14px] w-[14px] rounded-full bg-white border border-red-300 shadow-sm flex items-center justify-center">
      <span className="text-[9px] font-black text-red-600 leading-none">+</span>
    </div>
  );
}

function CoachCard({ staff }: { staff?: CoachingStaff }) {
  const [imgError, setImgError] = useState(false);
  if (!staff) return <p className="text-xs text-secondary">—</p>;
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-card border border-border flex items-center justify-center">
        {staff.photo_url && !imgError ? (
          <Image src={staff.photo_url} alt={staff.first_name} width={40} height={40} className="object-cover w-full h-full" onError={() => setImgError(true)} />
        ) : (
          <span className="text-[10px] font-bold text-secondary">DT</span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-primary leading-snug">
          {staff.last_name} {staff.first_name}
        </p>
        <p className="text-[10px] text-secondary capitalize">{staff.role}</p>
      </div>
    </div>
  );
}

function SubCard({ lineup }: { lineup: MatchLineupWithPlayer }) {
  const [imgError, setImgError] = useState(false);
  const photo = lineup.player.photo_url;
  const number = lineup.shirt_number ?? lineup.player.jersey_number;
  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-card border border-border flex items-center justify-center">
        {photo && !imgError ? (
          <Image src={photo} alt={lineup.player.first_name} width={32} height={32} className="object-cover w-full h-full" onError={() => setImgError(true)} />
        ) : (
          <span className="text-[10px] font-bold text-secondary">{number ?? '?'}</span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-primary leading-snug truncate">
          {number != null && <span className="text-secondary mr-1">#{number}</span>}
          {formatPlayerName(lineup.player.first_name, lineup.player.last_name)}
        </p>
        {lineup.position_label && (
          <p className="text-[10px] text-secondary">{lineup.position_label}</p>
        )}
      </div>
    </div>
  );
}

export function LineupSection({
  homeStarters,
  awayStarters,
  homeSubs,
  awaySubs,
  homeClubName,
  awayClubName,
  homeStaff,
  awayStaff,
  homeSuspended,
  awaySuspended,
  homeInjured,
  awayInjured,
}: Props) {
  const hasCoaches = (homeStaff?.length ?? 0) > 0 || (awayStaff?.length ?? 0) > 0;
  const hasSubs = homeSubs.length > 0 || awaySubs.length > 0;
  const allSuspended = [...(homeSuspended ?? []), ...(awaySuspended ?? [])];
  const allInjured = [...(homeInjured ?? []), ...(awayInjured ?? [])];
  const hasUnavailable = allSuspended.length > 0 || allInjured.length > 0;

  return (
    <div className="space-y-5">
      {/* 1. Cancha — full bleed (breaks out of px-4 container) */}
      <div className="-mx-4">
        <FullPitchFormation homeStarters={homeStarters} awayStarters={awayStarters} />
      </div>

      {/* 2. Entrenador */}
      {hasCoaches && (
        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-secondary">
            Entrenador
          </p>
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-elevated px-3 py-3">
            <div>
              <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-secondary truncate">
                {homeClubName}
              </p>
              <CoachCard staff={homeStaff?.[0]} />
            </div>
            <div>
              <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-secondary truncate">
                {awayClubName}
              </p>
              <CoachCard staff={awayStaff?.[0]} />
            </div>
          </div>
        </section>
      )}

      {/* 3. Banquillo */}
      {hasSubs && (
        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-secondary">
            Banquillo
          </p>
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-elevated px-3 py-2">
            <div>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-secondary truncate">
                {homeClubName}
              </p>
              {homeSubs.length > 0 ? (
                homeSubs.map((l) => <SubCard key={l.id} lineup={l} />)
              ) : (
                <p className="text-xs text-secondary py-1">—</p>
              )}
            </div>
            <div>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-secondary truncate">
                {awayClubName}
              </p>
              {awaySubs.length > 0 ? (
                awaySubs.map((l) => <SubCard key={l.id} lineup={l} />)
              ) : (
                <p className="text-xs text-secondary py-1">—</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 4. Lesionados y suspendidos */}
      {hasUnavailable && (
        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-secondary">
            Lesionados y suspendidos
          </p>
          <div className="rounded-xl bg-elevated px-3 py-2 space-y-0.5">
            {allSuspended.map((s) => (
              <div key={`susp-${s.player_id}`} className="flex items-center gap-2.5 py-1.5">
                <div className="relative h-8 w-8 flex-shrink-0">
                  <PlayerAvatar photo={s.photo_url} firstName={s.first_name} lastName={s.last_name} />
                  <RedCardBadge />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-primary">
                    {formatPlayerName(s.first_name, s.last_name)}
                  </p>
                  <p className="text-[10px] text-secondary">{s.reason}</p>
                </div>
              </div>
            ))}
            {allInjured.map((p) => (
              <div key={`inj-${p.player_id}`} className="flex items-center gap-2.5 py-1.5">
                <div className="relative h-8 w-8 flex-shrink-0">
                  <PlayerAvatar photo={p.photo_url} firstName={p.first_name} lastName={p.last_name} />
                  <MedicalBadge />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-primary">
                    {formatPlayerName(p.first_name, p.last_name)}
                  </p>
                  <p className="text-[10px] text-secondary">{p.description}</p>
                  {p.estimated_recovery && (
                    <p className="text-[10px] text-secondary/70">{p.estimated_recovery}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
