import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getClubBySlug, getClubTrophies, getClubTransfers, getNewsByClub } from '@/lib/queries/clubs';
import { getPlayersByClub, getPlayersByClubInPrimera } from '@/lib/queries/players';
import { getMatchesByClub } from '@/lib/queries/matches';
import { getActiveTournamentByDivision } from '@/lib/queries/divisions';
import { getDivisions } from '@/lib/queries/divisions';
import { getStandingsByTournament } from '@/lib/queries/standings';
import { ClubTabs } from './ClubTabs';
import type { StandingWithClub } from '@/types';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ClubPage({ params }: Props) {
  const { slug } = await params;
  const club = await getClubBySlug(slug);
  if (!club) notFound();

  const [matches, trophies, transfers, news, primeraPlayers, divisions] = await Promise.all([
    getMatchesByClub(club.id),
    getClubTrophies(club.id),
    getClubTransfers(club.id),
    getNewsByClub(club.name),
    getPlayersByClubInPrimera(club.id),
    getDivisions(),
  ]);

  // Find standings for any active tournament where this club participates
  let standings: StandingWithClub[] = [];
  for (const division of divisions) {
    const tournament = await getActiveTournamentByDivision(division.id);
    if (!tournament) continue;
    const divisionStandings = await getStandingsByTournament(tournament.id);
    if (divisionStandings.some((s) => s.club_id === club.id)) {
      standings = divisionStandings;
      break;
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-elevated px-4 pb-5 pt-4">
        <div className="flex items-center gap-4">
          {club.logo_url ? (
            <Image src={club.logo_url} alt={club.name} width={72} height={72}
              className="rounded-full object-contain flex-shrink-0" />
          ) : (
            <div
              className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-full text-2xl font-black text-white"
              style={{ backgroundColor: club.primary_color || '#333' }}
            >
              {(club.short_name ?? club.name).slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-black text-primary">{club.name}</h1>
            {club.short_name && (
              <p className="text-sm text-secondary">{club.short_name}</p>
            )}
            {club.founded_year && (
              <p className="text-xs text-secondary mt-0.5">Fundado en {club.founded_year}</p>
            )}
            {(club.primary_color || club.secondary_color) && (
              <div className="mt-1.5 flex gap-1.5">
                {club.primary_color && (
                  <span className="h-4 w-4 rounded-full border border-border"
                    style={{ backgroundColor: club.primary_color }} />
                )}
                {club.secondary_color && (
                  <span className="h-4 w-4 rounded-full border border-border"
                    style={{ backgroundColor: club.secondary_color }} />
                )}
              </div>
            )}
          </div>
        </div>
        {club.extra_info && (
          <p className="mt-3 text-sm text-secondary leading-relaxed">{club.extra_info}</p>
        )}
      </div>

      <ClubTabs
        clubId={club.id}
        matches={matches}
        standings={standings}
        transfers={transfers}
        trophies={trophies}
        news={news}
        players={primeraPlayers}
      />
    </div>
  );
}
