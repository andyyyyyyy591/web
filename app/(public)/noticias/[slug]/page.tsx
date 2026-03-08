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
        <Link href="/noticias" className="text-sm text-green-600 hover:underline">
          ← Volver a noticias
        </Link>
      </div>

      {news.image_url && (
        <div className="relative mb-8 h-72 w-full overflow-hidden rounded-2xl sm:h-96">
          <Image src={news.image_url} alt={news.title} fill className="object-cover" priority />
        </div>
      )}

      <p className="mb-3 text-sm text-slate-400 capitalize">{formatDate(news.published_at)}</p>
      <h1 className="mb-4 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">{news.title}</h1>

      {news.excerpt && (
        <p className="mb-6 text-lg text-slate-600 leading-relaxed">{news.excerpt}</p>
      )}

      <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:font-bold">
        {news.content.split('\n').map((line, i) =>
          line.trim() ? <p key={i} className="mb-4 text-slate-700 leading-relaxed">{line}</p> : <br key={i} />
        )}
      </div>
    </article>
  );
}
