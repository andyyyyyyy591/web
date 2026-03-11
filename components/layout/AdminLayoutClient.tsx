'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { AdminRole } from '@/types';

// ─── Iconos ─────────────────────────────────────────────────────────────────

function IconMenu() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

// ─── Nav items ───────────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  emoji: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/admin',               label: 'Dashboard',      emoji: '📊' },
  { href: '/admin/partidos',      label: 'Partidos',       emoji: '⚽' },
  { href: '/admin/jugadores',     label: 'Jugadores',      emoji: '👤' },
  { href: '/admin/cuerpo-tecnico', label: 'Cuerpo técnico', emoji: '👨‍💼' },
  { href: '/admin/suspensiones',  label: 'Suspensiones',   emoji: '🟥', adminOnly: true },
  { href: '/admin/clubes',        label: 'Clubes',         emoji: '🏟️', adminOnly: true },
  { href: '/admin/noticias',      label: 'Noticias',       emoji: '📰', adminOnly: true },
  { href: '/admin/temporadas',    label: 'Temporadas',     emoji: '📅', adminOnly: true },
  { href: '/admin/trofeos',       label: 'Trofeos',        emoji: '🏆', adminOnly: true },
  { href: '/admin/fichajes',      label: 'Fichajes',       emoji: '🔄', adminOnly: true },
  { href: '/admin/usuarios',      label: 'Usuarios',       emoji: '👥', adminOnly: true },
];

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  role: AdminRole | null;
  clubId: string | null;
  userEmail: string;
  children: React.ReactNode;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function AdminLayoutClient({ role, clubId, userEmail, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isSuperAdmin = role === 'admin';
  const visibleItems = navItems.filter((i) => !i.adminOnly || isSuperAdmin);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  function isActive(href: string) {
    return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
          <img src="/favicon.png" alt="Conexión Sur" className="h-8 w-8 rounded-lg object-contain" />
          <div>
            <p className="text-sm font-bold text-slate-800">Conexión Sur</p>
            <p className="text-xs text-slate-400">Panel admin</p>
          </div>
        </Link>
        <button
          className="md:hidden rounded-lg p-1.5 text-slate-400 hover:text-slate-700"
          onClick={() => setSidebarOpen(false)}
        >
          <IconClose />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive(item.href)
                ? 'bg-green-50 text-green-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-base">{item.emoji}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 p-3 space-y-2">
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <p className="truncate text-xs font-medium text-slate-700">{userEmail}</p>
          <p className="text-xs text-slate-400">
            {isSuperAdmin ? 'Super admin' : 'Admin de equipo'}
          </p>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
        >
          <IconLogout />
          {loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-60 flex-col border-r border-slate-200 bg-white flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white md:hidden">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
          >
            <IconMenu />
          </button>
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="Conexión Sur" className="h-7 w-7 rounded-lg object-contain" />
            <span className="text-sm font-semibold text-slate-800">Admin</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
