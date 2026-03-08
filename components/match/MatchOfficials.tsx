import type { Match } from '@/types';

interface MatchOfficialsProps {
  match: Pick<Match, 'referee' | 'referee_assistant_1' | 'referee_assistant_2' | 'referee_fourth'>;
}

export function MatchOfficials({ match }: MatchOfficialsProps) {
  const officials = [
    { label: 'Árbitro principal', value: match.referee },
    { label: 'Asistente 1', value: match.referee_assistant_1 },
    { label: 'Asistente 2', value: match.referee_assistant_2 },
    { label: '4° árbitro', value: match.referee_fourth },
  ].filter((o) => o.value);

  if (officials.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 font-semibold text-slate-800">Árbitros</h3>
      <div className="space-y-1.5">
        {officials.map((o) => (
          <div key={o.label} className="flex items-center justify-between text-sm">
            <span className="text-slate-500">{o.label}</span>
            <span className="font-medium text-slate-800">{o.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
