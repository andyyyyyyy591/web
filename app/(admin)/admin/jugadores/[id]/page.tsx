import { notFound } from 'next/navigation';
import { getPlayerById } from '@/lib/queries/players';
import { EditPlayerForm } from './EditPlayerForm';
import { requireOwnClub } from '@/lib/utils/admin-guard';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarJugadorPage({ params }: Props) {
  const { id } = await params;
  const player = await getPlayerById(id);
  if (!player) notFound();
  await requireOwnClub(player.club_id);
  return <EditPlayerForm player={player} />;
}
