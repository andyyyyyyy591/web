import Link from 'next/link';
import { ClubLogo } from '@/components/ui/ClubLogo';
import type { StandingWithClub } from '@/types';

interface StandingsTableProps {
  standings: StandingWithClub[];
  compact?: boolean;
}

export function StandingsTable({ standings, compact = false }: StandingsTableProps) {
  const rows = compact ? standings.slice(0, 5) : standings;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2 text-left">#</th>
            <th className="px-3 py-2 text-left">Club</th>
            <th className="px-3 py-2 text-center">PJ</th>
            <th className="px-3 py-2 text-center">G</th>
            <th className="px-3 py-2 text-center">E</th>
            <th className="px-3 py-2 text-center">P</th>
            {!compact && (
              <>
                <th className="px-3 py-2 text-center">GF</th>
                <th className="px-3 py-2 text-center">GC</th>
                <th className="px-3 py-2 text-center">DG</th>
              </>
            )}
            <th className="px-3 py-2 text-center font-bold text-slate-800">PTS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((s, i) => (
            <tr key={s.id} className="hover:bg-slate-50">
              <td className="px-3 py-2 text-slate-500">{i + 1}</td>
              <td className="px-3 py-2">
                <Link
                  href={`/clubes/${s.club.slug}`}
                  className="flex items-center gap-2 hover:text-green-700"
                >
                  <ClubLogo url={s.club.logo_url} name={s.club.name} size={20} />
                  <span className="font-medium">{s.club.short_name ?? s.club.name}</span>
                </Link>
              </td>
              <td className="px-3 py-2 text-center">{s.played}</td>
              <td className="px-3 py-2 text-center">{s.won}</td>
              <td className="px-3 py-2 text-center">{s.drawn}</td>
              <td className="px-3 py-2 text-center">{s.lost}</td>
              {!compact && (
                <>
                  <td className="px-3 py-2 text-center">{s.goals_for}</td>
                  <td className="px-3 py-2 text-center">{s.goals_against}</td>
                  <td className="px-3 py-2 text-center">
                    {s.goal_difference > 0 ? `+${s.goal_difference}` : s.goal_difference}
                  </td>
                </>
              )}
              <td className="px-3 py-2 text-center font-bold text-slate-900">{s.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
