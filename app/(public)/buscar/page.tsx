'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ClubLogo } from '@/components/ui/ClubLogo';
import { PlayerPhoto } from '@/components/ui/PlayerPhoto';

interface PageResult {
  label: string;
  url: string;
  icon: string;
  description: string;
}

interface SearchResults {
  pages: PageResult[];
  clubs: Array<{ id: string; name: string; slug: string; logo_url: string | null; primary_color: string }>;
  players: Array<{ id: string; first_name: string; last_name: string; photo_url: string | null; club_name: string; is_injured: boolean; is_suspended: boolean }>;
  news: Array<{ id: string; title: string; slug: string; image_url: string | null; excerpt: string | null }>;
}

const QUICK_LINKS: PageResult[] = [
  { label: 'Tabla · Primera División',  url: '/primera',             icon: '📊', description: 'Tabla de posiciones' },
  { label: 'Tabla · Cuarta División',   url: '/cuarta',              icon: '📊', description: 'Tabla de posiciones' },
  { label: 'Tabla · Quinta División',   url: '/quinta',              icon: '📊', description: 'Tabla de posiciones' },
  { label: 'Tabla · Séptima División',  url: '/septima',             icon: '📊', description: 'Tabla de posiciones' },
  { label: 'Goleadores · Primera',      url: '/primera?tab=Goleadores',  icon: '🥅', description: 'Tabla de goleadores' },
  { label: 'Goleadores · Cuarta',       url: '/cuarta?tab=Goleadores',   icon: '🥅', description: 'Tabla de goleadores' },
];

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
    ? results.pages.length + results.clubs.length + results.players.length + results.news.length
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
          placeholder="Buscar tabla, goleadores, equipos, jugadores…"
          className="w-full rounded-xl bg-elevated py-3 pl-9 pr-10 text-sm text-primary placeholder:text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Empty state: quick links */}
      {!query && (
        <div className="space-y-4">
          <div>
            <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-secondary">Accesos rápidos</h2>
            <div className="space-y-1">
              {QUICK_LINKS.map((link) => (
                <Link key={link.url} href={link.url}
                  className="flex items-center gap-3 rounded-xl bg-card px-3 py-3 hover:bg-elevated transition-colors">
                  <span className="text-xl w-8 text-center shrink-0">{link.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary">{link.label}</p>
                    <p className="text-xs text-secondary">{link.description}</p>
                  </div>
                  <svg className="ml-auto h-4 w-4 text-secondary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No results */}
      {results && total === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-secondary">Sin resultados para "{query}"</p>
          <p className="mt-1 text-xs text-secondary opacity-60">Probá buscar "tabla primera", "goleadores cuarta", un equipo o un jugador</p>
        </div>
      )}

      {/* Results */}
      {results && total > 0 && (
        <div className="space-y-6">

          {/* Pages */}
          {results.pages.length > 0 && (
            <section>
              <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-secondary">Páginas</h2>
              <div className="space-y-1">
                {results.pages.map((page) => (
                  <Link key={page.url} href={page.url}
                    className="flex items-center gap-3 rounded-xl bg-card px-3 py-3 hover:bg-elevated transition-colors">
                    <span className="text-xl w-8 text-center shrink-0">{page.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-primary">{page.label}</p>
                      <p className="text-xs text-secondary">{page.description}</p>
                    </div>
                    <svg className="ml-auto h-4 w-4 text-secondary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Clubs */}
          {results.clubs.length > 0 && (
            <section>
              <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-secondary">Equipos</h2>
              <div className="space-y-1">
                {results.clubs.map((club) => (
                  <Link key={club.id} href={`/clubes/${club.slug}`}
                    className="flex items-center gap-3 rounded-xl bg-card px-3 py-3 hover:bg-elevated transition-colors">
                    <ClubLogo
                      url={club.logo_url}
                      name={club.name}
                      size={36}
                      primaryColor={club.primary_color || '#444'}
                      textColor="white"
                    />
                    <span className="text-sm font-semibold text-primary">{club.name}</span>
                    <svg className="ml-auto h-4 w-4 text-secondary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Players */}
          {results.players.length > 0 && (
            <section>
              <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-secondary">Jugadores</h2>
              <div className="space-y-1">
                {results.players.map((player) => (
                  <Link key={player.id} href={`/jugadores/${player.id}`}
                    className="flex items-center gap-3 rounded-xl bg-card px-3 py-3 hover:bg-elevated transition-colors">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <PlayerPhoto
                        url={player.photo_url}
                        firstName={player.first_name}
                        lastName={player.last_name}
                        size={36}
                      />
                      {/* Badge: suspendido tiene prioridad sobre lesionado */}
                      {player.is_suspended && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-[13px] w-[9px] rounded-[2px] bg-red-600 border border-white/70 shadow-sm" />
                      )}
                      {!player.is_suspended && player.is_injured && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-[14px] w-[14px] rounded-full bg-white border border-red-300 shadow-sm flex items-center justify-center">
                          <span className="text-[9px] font-black text-red-600 leading-none">+</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-primary">{player.first_name} {player.last_name}</p>
                      <p className="text-xs text-secondary flex items-center gap-1.5">
                        {player.club_name}
                        {player.is_suspended && (
                          <span className="text-[10px] font-semibold text-red-500">· Suspendido</span>
                        )}
                        {!player.is_suspended && player.is_injured && (
                          <span className="text-[10px] font-semibold text-red-400">· Lesionado</span>
                        )}
                      </p>
                    </div>
                    <svg className="ml-auto h-4 w-4 text-secondary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* News */}
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
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-primary line-clamp-2 leading-tight">{item.title}</p>
                    </div>
                    <svg className="ml-auto h-4 w-4 text-secondary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
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
