import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getPlayerById, getPlayerStats, getPlayerMatchHistory } from '@/lib/queries/players';
import { POSITION_LABELS } from '@/types';
import { PlayerTabs } from './PlayerTabs';

interface Props {
  params: Promise<{ id: string }>;
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default async function JugadorPage({ params }: Props) {
  const { id } = await params;
  const [player, stats, matchHistory] = await Promise.all([
    getPlayerById(id),
    getPlayerStats(id),
    getPlayerMatchHistory(id),
  ]);
  if (!player) notFound();

  const age = calcAge(player.date_of_birth);

  return (
    <div>
      {/* Header */}
      <div className="bg-elevated px-4 pb-6 pt-4">
        <div className="flex items-center gap-4">
          {player.photo_url ? (
            <Image src={player.photo_url} alt={`${player.first_name} ${player.last_name}`}
              width={72} height={72} className="rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="flex h-18 w-18 flex-shrink-0 items-center justify-center rounded-full bg-card text-xl font-bold text-secondary"
              style={{ width: 72, height: 72 }}>
              {player.first_name[0]}{player.last_name[0]}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-black text-primary">
              {player.first_name} {player.last_name}
            </h1>
            <Link href={`/clubes/${player.club.slug}`}
              className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
              {player.club.logo_url && (
                <Image src={player.club.logo_url} alt={player.club.name} width={14} height={14} className="object-contain" />
              )}
              {player.club.name}
            </Link>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {player.jersey_number != null && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent">
                  #{player.jersey_number}
                </span>
              )}
              {player.position && (
                <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-medium text-secondary">
                  {POSITION_LABELS[player.position]}
                </span>
              )}
              {age && (
                <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-medium text-secondary">
                  {age} años
                </span>
              )}
              {player.nationality && player.nationality !== 'Argentina' && (
                <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-medium text-secondary">
                  {player.nationality}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <PlayerTabs player={player} stats={stats} matchHistory={matchHistory} />
    </div>
  );
}
