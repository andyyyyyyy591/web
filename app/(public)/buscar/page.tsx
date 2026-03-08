'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface SearchResults {
  clubs: Array<{ id: string; name: string; slug: string; logo_url: string | null; primary_color: string }>;
  players: Array<{ id: string; first_name: string; last_name: string; photo_url: string | null; club_name: string }>;
  news: Array<{ id: string; title: string; slug: string; image_url: string | null; excerpt: string | null }>;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function BuscarPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery.trim())}`)
      .then((r) => r.json())
      .then((data) => setResults(data))
      .catch(() => setResults(null))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const total = results
    ? results.clubs.length + results.players.length + results.news.length
    : 0;

  return (
    <div className="flex flex-col px-4 pt-4">
      {/* Search input */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        )}
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar equipos, jugadores, noticias…"
          className="w-full rounded-xl bg-elevated py-3 pl-9 pr-10 text-sm text-primary placeholder:text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Empty state */}
      {!query && (
        <div className="py-16 text-center">
          <p className="text-4xl">🔍</p>
          <p className="mt-3 text-sm text-secondary">Buscá equipos, jugadores o noticias</p>
        </div>
      )}

      {/* No results */}
      {results && total === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-secondary">Sin resultados para "{query}"</p>
        </div>
      )}

      {/* Results */}
      {results && total > 0 && (
        <div className="space-y-6">
          {results.clubs.length > 0 && (
            <section>
              <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-secondary">Equipos</h2>
              <div className="space-y-1">
                {results.clubs.map((club) => (
                  <Link key={club.id} href={`/clubes/${club.slug}`}
                    className="flex items-center gap-3 rounded-xl bg-card px-3 py-3 hover:bg-elevated transition-colors">
                    {club.logo_url ? (
                      <Image src={club.logo_url} alt={club.name} width={36} height={36}
                        className="h-9 w-9 rounded-full object-contain" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-sm text-white"
                        style={{ backgroundColor: club.primary_color || '#444' }}>
                        {club.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-primary">{club.name}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.players.length > 0 && (
            <section>
              <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-secondary">Jugadores</h2>
              <div className="space-y-1">
                {results.players.map((player) => (
                  <Link key={player.id} href={`/jugadores/${player.id}`}
                    className="flex items-center gap-3 rounded-xl bg-card px-3 py-3 hover:bg-elevated transition-colors">
                    {player.photo_url ? (
                      <Image src={player.photo_url} alt={player.first_name} width={36} height={36}
                        className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-elevated text-xs font-bold text-secondary">
                        {player.first_name[0]}{player.last_name[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-primary">{player.first_name} {player.last_name}</p>
                      <p className="text-xs text-secondary">{player.club_name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.news.length > 0 && (
            <section>
              <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-secondary">Noticias</h2>
              <div className="space-y-1">
                {results.news.map((item) => (
                  <Link key={item.id} href={`/noticias/${item.slug}`}
                    className="flex items-center gap-3 rounded-xl bg-card px-3 py-3 hover:bg-elevated transition-colors">
                    {item.image_url && (
                      <Image src={item.image_url} alt={item.title} width={40} height={40}
                        className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-primary line-clamp-2 leading-tight">{item.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
