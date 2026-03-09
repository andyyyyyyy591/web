import { requireSuperAdmin } from '@/lib/utils/admin-guard';
import { getClubs } from '@/lib/queries/clubs';
import { NuevaNoticiaForm } from './NuevaNoticiaForm';

export default async function NuevaNoticiaPage() {
  await requireSuperAdmin();
  const clubs = await getClubs();
  return <NuevaNoticiaForm clubs={clubs} />;
}
