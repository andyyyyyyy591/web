import { notFound } from 'next/navigation';
import { getNewsById } from '@/lib/queries/news';
import { EditNewsForm } from './EditNewsForm';
import { requireSuperAdmin } from '@/lib/utils/admin-guard';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarNoticiaPage({ params }: Props) {
  await requireSuperAdmin();
  const { id } = await params;
  const news = await getNewsById(id);
  if (!news) notFound();
  return <EditNewsForm news={news} />;
}
