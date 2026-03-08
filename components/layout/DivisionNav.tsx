'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DivisionNavProps {
  divisionSlug: string;
}

const tabs = [
  { label: 'Resumen', href: '' },
  { label: 'Tabla',   href: '/tabla' },
  { label: 'Fixture', href: '/fixture' },
  { label: 'Goleadores', href: '/goleadores' },
];

export function DivisionNav({ divisionSlug }: DivisionNavProps) {
  const pathname = usePathname();
  const base = `/${divisionSlug}`;

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4">
        {tabs.map((tab) => {
          const href = `${base}${tab.href}`;
          const isActive = tab.href === ''
            ? pathname === base
            : pathname.startsWith(href);
          return (
            <Link
              key={tab.href}
              href={href}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
