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
          {/* Línea media */}
          <line x1="0" y1="160" x2="220" y2="160" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          {/* Círculo central */}
          <circle cx="110" cy="160" r="28" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          {/* Área penal superior */}
          <rect x="44" y="0" width="132" height="52" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          {/* Área penal inferior */}
          <rect x="44" y="268" width="132" height="52" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        </svg>

        {/* Jugadores */}
        {starters.map((lineup) => {
          const x = ((lineup.field_x ?? 50) / 100) * 220;
          const rawY = (lineup.field_y ?? 50) / 100;
          const y = (flip ? 1 - rawY : rawY) * 320;
          return (
            <div
              key={lineup.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: x, top: y }}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-green-700 shadow">
                {lineup.shirt_number ?? '?'}
              </div>
              <span className="mt-0.5 max-w-[60px] truncate rounded bg-black/40 px-1 text-center text-[9px] leading-tight text-white">
                {formatPlayerShort(lineup.player.first_name, lineup.player.last_name)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
