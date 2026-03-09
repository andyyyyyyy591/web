import Image from 'next/image';
import type { MatchLineupWithPlayer, CoachingStaff } from '@/types';
import { formatPlayerName } from '@/lib/utils/format';

interface SuspendedEntry {
  player_id: string;
  first_name: string;
  last_name: string;
}

interface MatchLineupProps {
  starters: MatchLineupWithPlayer[];
  subs: MatchLineupWithPlayer[];
  clubName: string;
  suspended?: SuspendedEntry[];
  staff?: CoachingStaff[];
}

function PlayerRow({ lineup }: { lineup: MatchLineupWithPlayer }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50">
      {lineup.shirt_number != null && (
        <span className="w-6 text-right text-xs font-bold text-slate-500">
          {lineup.shirt_number}
        </span>
      )}
      <div>
        <span className="text-sm font-medium text-slate-800">
          {formatPlayerName(lineup.player.first_name, lineup.player.last_name)}
        </span>
        {lineup.position_label && (
          <span className="ml-2 text-xs text-slate-400">{lineup.position_label}</span>
        )}
      </div>
    </div>
  );
}

export function MatchLineup({ starters, subs, clubName, suspended, staff }: MatchLineupProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 font-semibold text-slate-800">{clubName}</h3>

      {starters.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Titulares</p>
          {starters.map((l) => <PlayerRow key={l.id} lineup={l} />)}
        </div>
      )}

      {subs.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Suplentes</p>
          {subs.map((l) => <PlayerRow key={l.id} lineup={l} />)}
        </div>
      )}

      {suspended && suspended.length > 0 && (
        <div className="border-t border-slate-100 pt-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-400">Suspendidos</p>
          {suspended.map((s) => (
            <div key={s.player_id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 opacity-60">
              <span className="text-xs">🚫</span>
              <span className="text-sm text-slate-500">{formatPlayerName(s.first_name, s.last_name)}</span>
            </div>
          ))}
        </div>
      )}

      {staff && staff.length > 0 && (
        <div className="border-t border-slate-100 pt-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Cuerpo técnico</p>
          {staff.map((s) => (
            <div key={s.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5">
              <div className="h-7 w-7 flex-shrink-0 overflow-hidden rounded-full bg-slate-200 flex items-center justify-center">
                {s.photo_url ? (
                  <Image src={s.photo_url} alt={s.first_name} width={28} height={28} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-[10px] text-slate-500 font-bold">DT</span>
                )}
              </div>
              <span className="flex-1 text-sm text-slate-700">{s.last_name} {s.first_name}</span>
              <span className="text-xs text-slate-400">{s.role}</span>
            </div>
          ))}
        </div>
      )}

      {starters.length === 0 && subs.length === 0 && !suspended?.length && !staff?.length && (
        <p className="text-sm text-slate-400">Sin alineación registrada</p>
      )}
    </div>
  );
}
