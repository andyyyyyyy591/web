import Link from 'next/link';
import type { Division } from '@/types';
import { NavbarSearch } from './NavbarSearch';

interface NavbarProps {
  divisions: Division[];
}

export function Navbar({ divisions }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white font-black text-sm">
            LF
          </div>
          <span className="hidden font-bold text-slate-900 sm:block">Liga Fútbol</span>
        </Link>

        {/* Nav divisiones */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {divisions.map((d) => (
            <Link
              key={d.id}
              href={`/${d.slug}`}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {d.label}
            </Link>
          ))}
          <Link
            href="/clubes"
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            Clubes
          </Link>
          <Link
            href="/noticias"
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            Noticias
          </Link>
        </nav>

        {/* Búsqueda + admin */}
        <div className="ml-auto flex items-center gap-2">
          <NavbarSearch />
          <Link
            href="/admin"
            className="hidden rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 sm:block"
          >
            Admin
          </Link>
        </div>
      </div>

      {/* Nav móvil */}
      <div className="flex overflow-x-auto border-t border-slate-100 px-4 py-1.5 md:hidden">
        {divisions.map((d) => (
          <Link
            key={d.id}
            href={`/${d.slug}`}
            className="flex-shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-green-600"
          >
            {d.label}
          </Link>
        ))}
        <Link href="/clubes" className="flex-shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-green-600">
          Clubes
        </Link>
        <Link href="/noticias" className="flex-shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-green-600">
          Noticias
        </Link>
      </div>
    </header>
  );
}
