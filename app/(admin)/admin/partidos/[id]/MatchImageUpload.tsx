'use client';

import { useState } from 'react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { updateMatch } from '@/lib/actions/matches';

interface Props {
  matchId: string;
  currentImageUrl: string | null;
}

export function MatchImageUpload({ matchId, currentImageUrl }: Props) {
  const [saved, setSaved] = useState(false);

  async function handleUploaded(url: string) {
    await updateMatch(matchId, { image_url: url || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 font-semibold text-slate-800">Imagen del partido</h2>
      <ImageUpload
        bucket="covers"
        currentUrl={currentImageUrl}
        onUploaded={handleUploaded}
        label="Foto del partido"
      />
      {saved && <p className="mt-2 text-sm text-green-600">Imagen guardada</p>}
    </div>
  );
}
