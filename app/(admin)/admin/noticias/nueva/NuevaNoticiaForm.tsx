'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createNews } from '@/lib/actions/news';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { BackButton } from '@/components/ui/BackButton';

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 100);
}

export function NuevaNoticiaForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [publishedAt, setPublishedAt] = useState(new Date().toISOString().slice(0, 16));
  const [isPublished, setIsPublished] = useState(false);

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slug) setSlug(toSlug(val));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await createNews({
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

  const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500';

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <BackButton href="/admin/noticias" />
        <h1 className="text-2xl font-bold text-slate-900">Nueva noticia</h1>
      </div>

      <p className="text-sm text-slate-500 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
        Los clubes mencionados en el título o contenido se asocian automáticamente.
      </p>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <ImageUpload bucket="news" currentUrl={imageUrl || null} onUploaded={setImageUrl} label="Imagen destacada" />

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Título *</label>
          <input required value={title} onChange={(e) => handleTitleChange(e.target.value)} className={inputCls} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Slug *</label>
          <input required value={slug} onChange={(e) => setSlug(e.target.value)}
            placeholder="mi-noticia-titulo" className={`${inputCls} font-mono`} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Resumen (opcional)</label>
          <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Breve descripción para la lista de noticias" className={inputCls} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Contenido *</label>
          <textarea required value={content} onChange={(e) => setContent(e.target.value)}
            rows={10} className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Fecha de publicación</label>
            <input type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} className={inputCls} />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500" />
              Publicar ahora
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Crear noticia'}</Button>
          <Button type="button" variant="secondary" onClick={() => router.push('/admin/noticias')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
