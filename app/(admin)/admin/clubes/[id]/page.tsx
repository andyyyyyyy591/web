import { notFound } from 'next/navigation';
import { getClubById } from '@/lib/queries/clubs';
import { EditClubForm } from './EditClubForm';
import { requireSuperAdmin } from '@/lib/utils/admin-guard';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarClubPage({ params }: Props) {
  await requireSuperAdmin();
  const { id } = await params;
  const club = await getClubById(id);
  if (!club) notFound();
  return <EditClubForm club={club} />;
}
