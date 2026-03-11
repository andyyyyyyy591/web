import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getMatchById } from '@/lib/queries/matches';
import { getTournamentClubsForFixture } from '@/lib/actions/tournaments';
import { getAllPlayers } from '@/lib/queries/players';
import { getClubs } from '@/lib/queries/clubs';
import { STATUS_LABELS } from '@/types';
import { formatDateTime } from '@/lib/utils/format';
import { Badge } from '@/components/ui/Badge';
import { BackButton } from '@/components/ui/BackButton';
import { MatchImageUpload } from './MatchImageUpload';
import { MatchEditForm } from './MatchEditForm';
import { FinishMatchButton } from './FinishMatchButton';
import { MatchEventsPanel } from './MatchEventsPanel';
import { requireSuperAdmin } from '@/lib/utils/admin-guard';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminMatchPage({ params }: Props) {
  await requireSuperAdmin();
  const { id } = await params;
  const match = await getMatchById(id);
  if (!match) notFound();

  const hasLive = match.tournament.division.has_live_mode;

  const [tournamentClubs, allClubs, allPlayers] = await Promise.all([
    getTournamentClubsForFixture(match.tournament.id),
    getClubs(),
    getAllPlayers(),
  ]);
  const clubsFromTournament = tournamentClubs.map((tc) => ({ id: tc.club_id, name: tc.club_name }));
  // Always include the current home/away clubs even if not registered in tournament_clubs
  const knownIds = new Set(clubsFromTournament.map((c) => c.id));
  const clubs = [...clubsFromTournament];
  if (!knownIds.has(match.home_club_id as string))
    clubs.push({ id: match.home_club_id as string, name: match.home_club.name });
  if (!knownIds.has(match.away_club_id as string))
    clubs.push({ id: match.away_club_id as string, name: match.away_club.name });

  const matchClubs = allClubs.filter(
    (c) => c.id === match.home_club_id || c.id === match.away_club_id,
  );
  const matchPlayers = allPlayers.filter(
    (p) => p.club_id === match.home_club_id || p.club_id === match.away_club_id,
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <BackButton href="/admin/partidos" />
        <h1 className="text-xl font-bold text-slate-900">
          {match.home_club.name} vs {match.away_club.name}
        </h1>
        {hasLive && (
          <Link
            href={`/admin/partidos/${id}/live`}
            className="ml-auto rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Panel en vivo →
          </Link>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">Estado</dt>
            <dd><Badge>{STATUS_LABELS[match.status]}</Badge></dd>
          </div>
          <div>
            <dt className="text-slate-500">División</dt>
            <dd className="font-medium">{match.tournament.division.label}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Fecha programada</dt>
            <dd className="font-medium">{formatDateTime(match.scheduled_at)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Estadio</dt>
            <dd className="font-medium">{match.stadium ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Árbitro</dt>
            <dd className="font-medium">{match.referee ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Marcador</dt>
            <dd className="font-bold text-lg">{match.home_score} — {match.away_score}</dd>
          </div>
        </dl>
      </div>

      <FinishMatchButton
        matchId={id}
        currentStatus={match.status}
        currentHomeScore={match.home_score ?? null}
        currentAwayScore={match.away_score ?? null}
        homeClubName={match.home_club.name}
        awayClubName={match.away_club.name}
      />

      <MatchEditForm
        matchId={id}
        clubs={clubs}
        initialValues={{
          home_club_id: match.home_club_id as string,
          away_club_id: match.away_club_id as string,
          home_score: match.home_score ?? null,
          away_score: match.away_score ?? null,
          scheduled_at: match.scheduled_at,
          stadium: match.stadium,
          referee: match.referee,
          referee_assistant_1: match.referee_assistant_1,
          referee_assistant_2: match.referee_assistant_2,
          referee_fourth: match.referee_fourth,
          notes: match.notes,
          match_zone: match.match_zone ?? null,
          round_label: match.round_label ?? null,
        }}
      />

      <MatchImageUpload matchId={id} currentImageUrl={(match as any).image_url ?? null} />

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Goles y tarjetas</h2>
        <MatchEventsPanel match={match as any} clubs={matchClubs} players={matchPlayers} />
      </div>
    </div>
  );
}
