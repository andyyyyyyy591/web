'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateNews } from '@/lib/actions/news';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { BackButton } from '@/components/ui/BackButton';
import type { News } from '@/types';

export function EditNewsForm({ news }: { news: News }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(news.title);
  const [slug, setSlug] = useState(news.slug);
  const [content, setContent] = useState(news.content);
  const [excerpt, setExcerpt] = useState(news.excerpt ?? '');
  const [imageUrl, setImageUrl] = useState(news.image_url ?? '');
  const [publishedAt, setPublishedAt] = useState(
    news.published_at ? new Date(news.published_at).toISOString().slice(0, 16) : ''
  );
  const [isPublished, setIsPublished] = useState(news.is_published);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await updateNews(news.id, {
      title,
      slug,
      content,
      excerpt: excerpt || undefined,
      image_url: imageUrl || undefined,
      published_at: publishedAt ? new Date(publishedAt).toISOString() : undefined,
      is_published: isPublished,
    });
    setLoading(false);
    if (result.error) setError(result.error);
    else router.push('/admin/noticias');
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <BackButton href="/admin/noticias" />
        <h1 className="text-2xl font-bold text-slate-900">Editar noticia</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <ImageUpload
          bucket="news"
          currentUrl={imageUrl || null}
          onUploaded={setImageUrl}
          label="Imagen destacada"
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Título *</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Slug *</label>
          <input required value={slug} onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Resumen (opcional)</label>
          <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Contenido *</label>
          <textarea required value={content} onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Fecha de publicación</label>
            <input type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500" />
              Publicada
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar cambios'}</Button>
          <Button type="button" variant="secondary" onClick={() => router.push('/admin/noticias')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
