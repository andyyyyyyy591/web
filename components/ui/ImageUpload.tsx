'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { uploadImage, type StorageBucket } from '@/lib/actions/storage';

interface Props {
  bucket: StorageBucket;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  onUploading?: (uploading: boolean) => void;
  label?: string;
  className?: string;
}

export function ImageUpload({ bucket, currentUrl, onUploaded, onUploading, label = 'Imagen', className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openPicker() {
    if (loading) return;
    // Reset value so the same file can be re-selected after a failed upload
    if (inputRef.current) inputRef.current.value = '';
    inputRef.current?.click();
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setError(null);
    setLoading(true);
    onUploading?.(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadImage(formData, bucket);
      if ('error' in result) {
        setError(result.error);
        setPreview(currentUrl ?? null);
      } else {
        setPreview(objectUrl); // keep blob preview — it's already shown
        onUploaded(result.url);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir la imagen';
      setError(msg);
      setPreview(currentUrl ?? null);
    } finally {
      setLoading(false);
      onUploading?.(false);
    }
  }

  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-start gap-4">
        {/* Preview square */}
        <div
          onClick={openPicker}
          className="relative flex h-24 w-24 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-green-400 hover:bg-green-50"
        >
          {preview ? (
            preview.startsWith('blob:') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="preview" className="h-full w-full object-cover" />
            ) : (
              <Image src={preview} alt="preview" fill className="object-cover" sizes="96px" />
            )
          ) : (
            <span className="text-center text-xs text-slate-400 px-2">
              {loading ? 'Subiendo...' : 'Click para subir'}
            </span>
          )}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <svg className="h-6 w-6 animate-spin text-green-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-1.5">
          <button
            type="button"
            onClick={openPicker}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? 'Subiendo...' : preview ? 'Cambiar imagen' : 'Seleccionar imagen'}
          </button>
          {preview && !loading && (
            <button
              type="button"
              onClick={() => { setPreview(null); onUploaded(''); }}
              className="block text-xs text-red-500 hover:underline"
            >
              Quitar imagen
            </button>
          )}
          <p className="text-xs text-slate-400">JPG, PNG, WebP, HEIC y más · máx 5 MB</p>
          {error && (
            <p className="rounded-lg bg-red-50 px-2 py-1.5 text-xs font-medium text-red-600">
              ⚠ {error}
            </p>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
