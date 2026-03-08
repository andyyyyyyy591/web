import { requireSuperAdmin } from '@/lib/utils/admin-guard';
import { NuevoClubForm } from './NuevoClubForm';

export default async function NuevoClubPage() {
  await requireSuperAdmin();
  return <NuevoClubForm />;
}
