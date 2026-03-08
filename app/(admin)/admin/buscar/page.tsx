import Link from 'next/link';
import Image from 'next/image';
import { search } from '@/lib/queries/search';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminBuscarPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';
  const results = query.length >= 2 ? await search(query) : null;

  const total = results
    ? results.clubs.length + results.players.length + results.news.length
    : 0;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {query ? `Búsqueda: "${query}"` : 'Búsqueda'}
        </h1>
        {results && (
          <p className="mt-1 text-sm text-slate-500">
            {total === 0 ? 'Sin resultados' : `${total} resultado${total !== 1 ? 's' : ''}`}
          </p>
        )}
      </div>

      {!query && (
        <p className="text-slate-400">Ingresá un término en la barra de búsqueda del sidebar.</p>
      )}

      {results && total === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <p className="text-slate-400">No se encontraron resultados para &quot;{query}&quot;</p>
        </div>
      )}

      {results && results.clubs.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Clubes ({results.clubs.length})
          </h2>
          <div className="space-y-2">
            {results.clubs.map((club) => (
              <Link key={club.id} href={`/admin/clubes/${club.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50">
                {club.logo_url ? (
                  <Image src={club.logo_url} alt={club.name} width={32} height={32} className="h-8 w-8 rounded-full object-contain" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: club.primary_color }}>
                    {club.name[0]}
                  </div>
                )}
                <span className="font-medium text-slate-800">{club.name}</span>
                {club.short_name && <span className="text-sm text-slate-400">({club.short_name})</span>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {results && results.players.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Jugadores ({results.players.length})
          </h2>
          <div className="space-y-2">
            {results.players.map((player) => (
              <Link key={player.id} href={`/admin/jugadores/${player.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50">
                {player.photo_url ? (
                  <Image src={player.photo_url} alt={player.first_name} width={32} height={32}
                    className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-500">
                    {player.first_name[0]}{player.last_name[0]}
                  </div>
                )}
                <div>
                  <span className="font-medium text-slate-800">{player.first_name} {player.last_name}</span>
                  <span className="ml-2 text-sm text-slate-400">{player.club_name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {results && results.news.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Noticias ({results.news.length})
          </h2>
          <div className="space-y-2">
            {results.news.map((item) => (
              <Link key={item.id} href={`/admin/noticias/${item.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50">
                <div className="text-2xl">📰</div>
                <div>
                  <span className="font-medium text-slate-800">{item.title}</span>
                  {item.excerpt && <p className="text-sm text-slate-400 line-clamp-1">{item.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
