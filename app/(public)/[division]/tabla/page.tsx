import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ division: string }>;
}

export default async function TablaPage({ params }: Props) {
  const { division: slug } = await params;
  redirect(`/${slug}?tab=Tabla`);
}
