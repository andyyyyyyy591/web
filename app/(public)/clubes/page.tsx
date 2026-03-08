import Image from 'next/image';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';

export default async function ClubesPage() {
  const clubs = await getClubs();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Clubes</h1>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {clubs.map((club) => (
          <Link
            key={club.id}
            href={`/clubes/${club.slug}`}
            className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
          >
            {club.logo_url ? (
              <Image
                src={club.logo_url}
                alt={club.name}
                width={64}
                height={64}
                className="mb-3 object-contain"
              />
            ) : (
              <div
                className="mb-3 h-16 w-16 rounded-full"
                style={{ background: club.primary_color || '#94a3b8' }}
              />
            )}
            <p className="font-semibold text-slate-800">{club.name}</p>
            {club.founded_year && (
              <p className="text-xs text-slate-400">Fundado {club.founded_year}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
