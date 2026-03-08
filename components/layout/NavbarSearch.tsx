'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface SearchResults {
  clubs: Array<{ id: string; name: string; slug: string; logo_url: string | null; primary_color: string }>;
  players: Array<{ id: string; first_name: string; last_name: string; photo_url: string | null; club_name: string }>;
  news: Array<{ id: string; title: string; slug: string; image_url: string | null }>;
}

export function NavbarSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data: SearchResults = await res.json();
        setResults(data);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function close() {
    setOpen(false);
    setQuery('');
    setResults(null);
    setLoading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
      close();
    }
  }

  const hasResults = results && (results.clubs.length > 0 || results.players.length > 0 || results.news.length > 0);
  const noResults = results && !hasResults && query.trim().length >= 2 && !loading;
  const showDropdown = open && (loading || hasResults || noResults);

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        aria-label="Buscar"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar jugador, club..."
            className="w-56 rounded-lg border border-slate-300 py-1.5 pl-9 pr-3 text-sm focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400 sm:w-64"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-green-500" />
            </div>
          )}
        </div>
        <button type="button" onClick={close}
          className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </form>

      {showDropdown && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {loading && (
            <div className="px-4 py-5 text-center text-sm text-slate-400">Buscando...</div>
          )}

          {noResults && (
            <div className="px-4 py-5 text-center text-sm text-slate-400">
              Sin resultados para <strong>&ldquo;{query}&rdquo;</strong>
            </div>
          )}

          {hasResults && (
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-100">
              {results!.clubs.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Clubes</p>
                  {results!.clubs.map((club) => (
                    <Link
                      key={club.id}
                      href={`/clubes/${club.slug}`}
                      onClick={close}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                    >
                      {club.logo_url ? (
                        <Image src={club.logo_url} alt={club.name} width={28} height={28}
                          className="h-7 w-7 object-contain flex-shrink-0" />
                      ) : (
                        <div className="h-7 w-7 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: club.primary_color || '#94a3b8' }}>
                          {club.name[0]}
                        </div>
                      )}
                      <span className="text-sm font-medium text-slate-800">{club.name}</span>
                    </Link>
                  ))}
                </div>
              )}

              {results!.players.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Jugadores</p>
                  {results!.players.map((player) => (
                    <Link
                      key={player.id}
                      href={`/jugadores/${player.id}`}
                      onClick={close}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                    >
                      {player.photo_url ? (
                        <Image src={player.photo_url} alt={player.first_name} width={28} height={28}
                          className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-7 w-7 flex-shrink-0 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                          {player.first_name[0]}{player.last_name[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800">
                          {player.first_name} {player.last_name}
                        </p>
                        <p className="text-xs text-slate-400">{player.club_name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results!.news.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Noticias</p>
                  {results!.news.map((item) => (
                    <Link
                      key={item.id}
                      href={`/noticias/${item.slug}`}
                      onClick={close}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="h-7 w-7 flex-shrink-0 rounded bg-slate-100 flex items-center justify-center text-base">
                        📰
                      </div>
                      <p className="text-sm font-medium text-slate-800 line-clamp-1">{item.title}</p>
                    </Link>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-100 px-4 py-2.5">
                <button
                  onClick={() => { router.push(`/buscar?q=${encodeURIComponent(query)}`); close(); }}
                  className="text-xs font-medium text-green-600 hover:underline"
                >
                  Ver todos los resultados →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
