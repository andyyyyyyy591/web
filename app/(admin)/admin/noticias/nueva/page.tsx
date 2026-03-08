import { requireSuperAdmin } from '@/lib/utils/admin-guard';
import { NuevaNoticiaForm } from './NuevaNoticiaForm';

export default async function NuevaNoticiaPage() {
  await requireSuperAdmin();
  return <NuevaNoticiaForm />;
}
