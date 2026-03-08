import Link from 'next/link';
import Image from 'next/image';
import { getAllNews } from '@/lib/queries/news';
import { Button } from '@/components/ui/Button';
import { DeleteNewsButton } from './DeleteNewsButton';
import { requireSuperAdmin } from '@/lib/utils/admin-guard';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default async function AdminNoticiasPage() {
  await requireSuperAdmin();
  const news = await getAllNews();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Noticias</h1>
        <Link href="/admin/noticias/nueva">
          <Button>+ Nueva noticia</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {news.map((item) => (
          <div key={item.id} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
            {item.image_url ? (
              <Image src={item.image_url} alt={item.title} width={64} height={64}
                className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-2xl">
                📰
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold text-slate-800">{item.title}</p>
                <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  item.is_published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {item.is_published ? 'Publicada' : 'Borrador'}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-slate-400">{formatDate(item.published_at)}</p>
              {item.excerpt && <p className="mt-1 line-clamp-1 text-sm text-slate-500">{item.excerpt}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href={`/admin/noticias/${item.id}`}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Editar
              </Link>
              <DeleteNewsButton id={item.id} title={item.title} />
            </div>
          </div>
        ))}
        {news.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
            <p className="text-slate-400">Sin noticias aún</p>
            <Link href="/admin/noticias/nueva" className="mt-2 block text-sm text-green-600 hover:underline">
              Crear primera noticia
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
