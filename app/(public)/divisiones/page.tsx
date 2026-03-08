import Link from 'next/link';
import { getDivisions } from '@/lib/queries/divisions';

const ICONS: Record<string, string> = {
  primera: '🥇',
  reserva: '🥈',
  septima: '7️⃣',
  quinta: '5️⃣',
  cuarta: '4️⃣',
};

export default async function DivisionesPage() {
  const divisions = await getDivisions();

  return (
    <div className="px-4 pt-4 space-y-3">
      <h1 className="text-xl font-bold text-primary">Divisiones</h1>
      {divisions.map((d) => (
        <Link
          key={d.id}
          href={`/${d.slug}`}
          className="flex items-center justify-between rounded-2xl bg-card px-5 py-4 hover:bg-elevated transition-colors"
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl">{ICONS[d.slug] ?? '⚽'}</span>
            <div>
              <p className="font-bold text-primary">{d.label}</p>
              <p className="text-xs text-secondary mt-0.5">
                {d.has_live_mode ? 'Seguimiento en vivo · Tabla · Goleadores' : 'Tabla · Fixture · Goleadores'}
              </p>
            </div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </Link>
      ))}
    </div>
  );
}
