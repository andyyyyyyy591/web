import { notFound } from 'next/navigation';
import { getMatchById } from '@/lib/queries/matches';
import { MatchTabs } from './MatchTabs';
import { RealtimeMatchWrapper } from './RealtimeMatchWrapper';

interface Props {
  params: Promise<{ division: string; id: string }>;
}

export default async function MatchPage({ params }: Props) {
  const { id } = await params;
  const match = await getMatchById(id);
  if (!match) notFound();

  const hasLiveMode = match.tournament.division.has_live_mode;

  if (hasLiveMode) {
    return <RealtimeMatchWrapper initialMatch={match} />;
  }

  return <MatchTabs match={match} />;
}
