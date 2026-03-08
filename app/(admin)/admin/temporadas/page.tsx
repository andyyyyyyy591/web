import { requireSuperAdmin } from '@/lib/utils/admin-guard';
import { TemporadasForm } from './TemporadasForm';

export default async function TemporadasPage() {
  await requireSuperAdmin();
  return <TemporadasForm />;
}
