import Link from 'next/link';
import { getLiveMatches, getUpcomingMatches } from '@/lib/queries/matches';
import { getClubs } from '@/lib/queries/clubs';
import { getAllPlayers } from '@/lib/queries/players';
import { getAllNews } from '@/lib/queries/news';
import { MatchCard } from '@/components/match/MatchCard';
import { Badge } from '@/components/ui/Badge';

export default async function AdminDashboard() {
  const [liveMatches, upcoming, clubs, players, news] = await Promise.all([
    getLiveMatches(),
    getUpcomingMatches(4),
    getClubs(),
    getAllPlayers(),
    getAllNews(),
  ]);

  const stats = [
    { label: 'Clubes', value: clubs.length, href: '/admin/clubes', color: 'bg-blue-50 text-blue-700', icon: '🏟️' },
    { label: 'Jugadores', value: players.length, href: '/admin/jugadores', color: 'bg-green-50 text-green-700', icon: '👟' },
    { label: 'Noticias', value: news.length, href: '/admin/noticias', color: 'bg-orange-50 text-orange-700', icon: '📰' },
    { label: 'En vivo', value: liveMatches.length, href: '/admin/partidos', color: 'bg-red-50 text-red-700', icon: '🔴' },
    { label: 'Torneos', value: 0, href: '/admin/torneos', color: 'bg-purple-50 text-purple-700', icon: '🏆' },
  ];

  const quickLinks = [
    { href: '/admin/partidos/nuevo', label: '+ Partido' },
    { href: '/admin/clubes/nuevo',   label: '+ Club' },
    { href: '/admin/jugadores/nuevo', label: '+ Jugador' },
    { href: '/admin/noticias/nueva', label: '+ Noticia' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className={`rounded-xl px-2.5 py-1 text-2xl ${stat.color}`}>{stat.icon}</span>
              {stat.value > 0 && stat.label === 'En vivo' && (
                <span className="live-dot" />
              )}
            </div>
            <p className="mt-3 text-3xl font-black text-slate-900">{stat.value}</p>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* En vivo */}
      {liveMatches.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="live-dot" />
            <h2 className="font-semibold text-slate-800">Partidos en vivo</h2>
            <Badge variant="red">{liveMatches.length}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {liveMatches.map((m) => (
              <div key={m.id} className="rounded-xl border border-red-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1">{m.division_label}</p>
                    <p className="font-semibold text-slate-800">
                      {m.home_club_name} <span className="text-red-600 font-black">{m.home_score}—{m.away_score}</span> {m.away_club_name}
                    </p>
                  </div>
                  <Link
                    href={`/admin/partidos/${m.id}/live`}
                    className="ml-4 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                  >
                    Controlar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Próximos */}
      <section>
        <h2 className="mb-3 font-semibold text-slate-800">Próximos partidos</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-400">Sin próximos partidos</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        )}
      </section>
    </div>
  );
}
