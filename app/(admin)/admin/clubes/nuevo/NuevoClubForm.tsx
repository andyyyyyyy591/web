'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClub } from '@/lib/actions/clubs';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { BackButton } from '@/components/ui/BackButton';

export function NuevoClubForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [slug, setSlug] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#16a34a');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');
  const [foundedYear, setFoundedYear] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [extraInfo, setExtraInfo] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await createClub({
      name,
      short_name: shortName || undefined,
      slug,
      logo_url: logoUrl || undefined,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      founded_year: foundedYear ? parseInt(foundedYear) : undefined,
      extra_info: extraInfo || undefined,
    });
    setLoading(false);
    if (result.error) setError(result.error);
    else router.push('/admin/clubes');
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <BackButton />
        <h1 className="text-2xl font-bold text-slate-900">Nuevo club</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <ImageUpload
          bucket="logos"
          currentUrl={logoUrl || null}
          onUploaded={setLogoUrl}
          label="Logo del club"
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nombre *</label>
          <input required value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nombre corto</label>
            <input value={shortName} onChange={(e) => setShortName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Slug *</label>
            <input required value={slug} onChange={(e) => setSlug(e.target.value)}
              placeholder="club-nombre"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Color principal</label>
            <div className="flex items-center gap-2">
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-9 w-12 rounded-lg border border-slate-300 px-1 cursor-pointer" />
              <span className="text-sm text-slate-500">{primaryColor}</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Color secundario</label>
            <div className="flex items-center gap-2">
              <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-9 w-12 rounded-lg border border-slate-300 px-1 cursor-pointer" />
              <span className="text-sm text-slate-500">{secondaryColor}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Año de fundación</label>
          <input type="number" min="1800" max="2030" value={foundedYear}
            onChange={(e) => setFoundedYear(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Información extra (opcional)</label>
          <textarea value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)}
            rows={3} placeholder="Historia del club, barrio, estadio…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Crear club'}</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
