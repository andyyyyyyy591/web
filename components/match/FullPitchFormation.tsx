import Image from 'next/image';
import type { MatchLineupWithPlayer } from '@/types';
import { formatPlayerShort } from '@/lib/utils/format';

interface Props {
  homeStarters: MatchLineupWithPlayer[];
  awayStarters: MatchLineupWithPlayer[];
}

/** fieldX/fieldY are 0–100. fieldY=0 is own goal (GK), fieldY=100 is opponent goal (FWD). */
function getScreenCoords(fieldX: number, fieldY: number, isHome: boolean) {
  const x = 5 + (fieldX / 100) * 90; // 5% – 95% horizontally
  // Home occupies top half: GK(fieldY≈7) → ~5%, FWD(fieldY≈82) → ~41%
  // Away occupies bottom half: GK(fieldY≈7) → ~95%, FWD(fieldY≈82) → ~59%
  const y = isHome
    ? 2 + (fieldY / 100) * 47
    : 98 - (fieldY / 100) * 47;
  return { x, y };
}

function PlayerToken({ lineup, isHome }: { lineup: MatchLineupWithPlayer; isHome: boolean }) {
  const fieldX = lineup.field_x ?? 50;
  const fieldY = lineup.field_y ?? 50;
  const { x, y } = getScreenCoords(fieldX, fieldY, isHome);
  const photo = lineup.player.photo_url;
  const number = lineup.shirt_number ?? lineup.player.jersey_number;
  const name = formatPlayerShort(lineup.player.first_name, lineup.player.last_name);

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <div className="relative">
        <div className="h-8 w-8 rounded-full overflow-hidden border-[1.5px] border-white shadow-md bg-green-800 flex items-center justify-center">
          {photo ? (
            <Image
              src={photo}
              alt={name}
              width={32}
              height={32}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-[10px] font-bold text-white">
              {number != null ? number : name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        {number != null && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-[13px] w-[13px] items-center justify-center rounded-full border border-white/40 bg-black/75 text-[8px] font-black leading-none text-white">
            {number}
          </span>
        )}
      </div>
      <span
        className="mt-0.5 truncate rounded-sm bg-black/65 px-1 py-px text-center text-[8px] font-medium leading-tight text-white"
        style={{ maxWidth: 52 }}
      >
        {name}
      </span>
    </div>
  );
}

export function FullPitchFormation({ homeStarters, awayStarters }: Props) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg"
      style={{ aspectRatio: '2/3', backgroundColor: '#2e7d32' }}
    >
      {/* Pitch markings */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 300 450"
        preserveAspectRatio="none"
      >
        {/* Subtle alternating grass strips */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <rect
            key={i}
            x="0"
            y={i * 50}
            width="300"
            height="50"
            fill={i % 2 === 0 ? 'rgba(0,0,0,0.06)' : 'transparent'}
          />
        ))}

        {/* Outer border */}
        <rect x="8" y="8" width="284" height="434" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
        {/* Center line */}
        <line x1="8" y1="225" x2="292" y2="225" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
        {/* Center circle */}
        <circle cx="150" cy="225" r="36" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        {/* Center spot */}
        <circle cx="150" cy="225" r="2.5" fill="rgba(255,255,255,0.55)" />

        {/* Home penalty area (top) */}
        <rect x="72" y="8" width="156" height="65" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
        {/* Home 6-yard box */}
        <rect x="112" y="8" width="76" height="24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        {/* Home goal */}
        <rect x="127" y="2" width="46" height="8" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

        {/* Away penalty area (bottom) */}
        <rect x="72" y="377" width="156" height="65" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
        {/* Away 6-yard box */}
        <rect x="112" y="418" width="76" height="24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        {/* Away goal */}
        <rect x="127" y="440" width="46" height="8" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      </svg>

      {/* Home players (top half) */}
      {homeStarters.map((l) => (
        <PlayerToken key={l.id} lineup={l} isHome={true} />
      ))}

      {/* Away players (bottom half) */}
      {awayStarters.map((l) => (
        <PlayerToken key={l.id} lineup={l} isHome={false} />
      ))}
    </div>
  );
}
