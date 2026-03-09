import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getNewsBySlug } from '@/lib/queries/news';

interface Props {
  params: Promise<{ slug: string }>;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}

export default async function NoticiaPage({ params }: Props) {
  const { slug } = await params;
  const news = await getNewsBySlug(slug);
  if (!news) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link href="/noticias" className="text-sm text-accent hover:opacity-75 transition-opacity">
          ← Volver a noticias
        </Link>
      </div>

      {news.image_url && (
        <div className="relative mb-8 h-72 w-full overflow-hidden rounded-2xl sm:h-96">
          <Image src={news.image_url} alt={news.title} fill className="object-cover" priority />
        </div>
      )}

      <p className="mb-3 text-sm text-secondary capitalize">{formatDate(news.published_at)}</p>
      <h1 className="mb-4 text-3xl font-bold leading-tight text-primary sm:text-4xl">{news.title}</h1>

      {news.excerpt && (
        <p className="mb-6 text-base text-secondary leading-relaxed">{news.excerpt}</p>
      )}

      <div className="space-y-4">
        {news.content.split('\n').map((line, i) =>
          line.trim() ? <p key={i} className="text-sm text-primary/80 leading-relaxed">{line}</p> : <br key={i} />
        )}
      </div>
    </article>
  );
}
