import Image from 'next/image';
import type { MatchLineupWithPlayer } from '@/types';
import { formatPlayerShort } from '@/lib/utils/format';

interface FormationProps {
  starters: MatchLineupWithPlayer[];
  label?: string;
  flip?: boolean;
}

export function Formation({ starters, label, flip = false }: FormationProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && <h3 className="text-center text-sm font-semibold text-slate-700">{label}</h3>}
      <div
        className="relative mx-auto overflow-hidden rounded-xl bg-green-700"
        style={{ width: 220, height: 320 }}
      >
        {/* Líneas del campo */}
        <svg className="absolute inset-0" width="220" height="320" viewBox="0 0 220 320">
          <line x1="0" y1="160" x2="220" y2="160" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          <circle cx="110" cy="160" r="28" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          <rect x="44" y="0" width="132" height="52" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          <rect x="44" y="268" width="132" height="52" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        </svg>

        {/* Jugadores */}
        {starters.map((lineup) => {
          const x = ((lineup.field_x ?? 50) / 100) * 220;
          const rawY = (lineup.field_y ?? 50) / 100;
          const y = (flip ? 1 - rawY : rawY) * 320;
          const photo = lineup.player.photo_url;
          return (
            <div
              key={lineup.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: x, top: y }}
            >
              <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-white shadow bg-green-600 flex items-center justify-center">
                {photo ? (
                  <Image
                    src={photo}
                    alt={lineup.player.first_name}
                    width={32}
                    height={32}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-[10px] font-bold text-white">
                    {lineup.shirt_number ?? lineup.player.first_name.slice(0, 1)}
                  </span>
                )}
              </div>
              <span className="mt-0.5 max-w-[60px] truncate rounded bg-black/50 px-1 text-center text-[9px] leading-tight text-white">
                {formatPlayerShort(lineup.player.first_name, lineup.player.last_name)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
