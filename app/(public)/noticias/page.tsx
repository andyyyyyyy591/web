import Image from 'next/image';
import Link from 'next/link';
import { getPublishedNews } from '@/lib/queries/news';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default async function NoticiasPage() {
  const news = await getPublishedNews(30);

  if (news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-4xl">📰</p>
        <p className="mt-4 text-sm text-secondary">No hay noticias publicadas aún</p>
      </div>
    );
  }

  const [featured, ...rest] = news;

  return (
    <div className="space-y-4 px-4 pt-4 max-w-2xl mx-auto">
      {/* Featured */}
      <Link href={`/noticias/${featured.slug}`} className="group block">
        <article className="overflow-hidden rounded-2xl bg-card">
          <div className="relative h-52 sm:h-72 w-full">
            {featured.image_url ? (
              <Image src={featured.image_url} alt={featured.title} fill
                className="object-cover transition-transform group-hover:scale-105" />
            ) : (
              <div className="flex h-full items-center justify-center bg-elevated text-5xl">⚽</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="mb-1 text-[11px] font-semibold text-accent uppercase tracking-wide">
                {formatDate(featured.published_at)}
              </p>
              <h2 className="text-base font-bold text-white leading-tight line-clamp-2">
                {featured.title}
              </h2>
            </div>
          </div>
        </article>
      </Link>

      {/* Rest as list */}
      {rest.length > 0 && (
        <div className="space-y-1">
          {rest.map((item) => (
            <Link key={item.id} href={`/noticias/${item.slug}`} className="group flex items-center gap-3 rounded-xl bg-card p-3 hover:bg-elevated transition-colors">
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
                {item.image_url ? (
                  <Image src={item.image_url} alt={item.title} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-elevated text-xl">⚽</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-secondary">{formatDate(item.published_at)}</p>
                <h3 className="mt-0.5 text-sm font-semibold text-primary line-clamp-2 leading-tight">
                  {item.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
