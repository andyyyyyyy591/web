import { createClient } from '@/lib/supabase/server';
import type { Club, Player, News } from '@/types';

// ─── Page links ──────────────────────────────────────────────────────────────

export interface PageResult {
  label: string;
  url: string;
  icon: string;
  description: string;
}

const SECTIONS = [
  {
    key: 'tabla',
    keywords: ['tabla', 'posiciones', 'clasificacion', 'standing'],
    label: 'Tabla',
    icon: '📊',
    description: 'Tabla de posiciones',
    urlSuffix: '?tab=Tabla',
  },
  {
    key: 'fixture',
    keywords: ['partidos', 'partido', 'fixture', 'calendario', 'fechas', 'fecha', 'resultados', 'resultado'],
    label: 'Fixture',
    icon: '⚽',
    description: 'Fixture y resultados',
    urlSuffix: '?tab=Partidos',
  },
  {
    key: 'goleadores',
    keywords: ['goleadores', 'goleador', 'goles', 'gol', 'artilleros', 'artillero'],
    label: 'Goleadores',
    icon: '🥅',
    description: 'Tabla de goleadores',
    urlSuffix: '?tab=Goleadores',
  },
];

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents: é→e, ú→u, etc.
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function matchPages(
  query: string,
  divisions: Array<{ label: string; slug: string }>,
): PageResult[] {
  const words = normalize(query).split(/\s+/).filter((w) => w.length >= 2);
  if (words.length === 0) return [];

  // Match divisions by slug (primera, cuarta, septima, etc.)
  const matchedDivisions = divisions.filter((div) =>
    words.some((w) => w.length >= 3 && (div.slug === w || div.slug.startsWith(w))),
  );

  // Match sections by keywords
  const matchedSections = SECTIONS.filter((section) =>
    words.some((w) => section.keywords.some((kw) => kw === w || (w.length >= 4 && kw.startsWith(w)))),
  );

  const results: PageResult[] = [];

  if (matchedDivisions.length > 0 && matchedSections.length > 0) {
    // Specific: matched section(s) for matched division(s)
    for (const div of matchedDivisions) {
      for (const sec of matchedSections) {
        results.push({
          label: `${sec.label} · ${div.label}`,
          url: `/${div.slug}${sec.urlSuffix}`,
          icon: sec.icon,
          description: sec.description,
        });
      }
    }
  } else if (matchedDivisions.length > 0) {
    // Division only: show all 5 sections for that division
    for (const div of matchedDivisions) {
      for (const sec of SECTIONS) {
        results.push({
          label: `${sec.label} · ${div.label}`,
          url: `/${div.slug}${sec.urlSuffix}`,
          icon: sec.icon,
          description: sec.description,
        });
      }
    }
  } else if (matchedSections.length > 0) {
    // Section only: show that section for every division
    for (const sec of matchedSections) {
      for (const div of divisions) {
        results.push({
          label: `${sec.label} · ${div.label}`,
          url: `/${div.slug}${sec.urlSuffix}`,
          icon: sec.icon,
          description: sec.description,
        });
      }
    }
  }

  return results.slice(0, 8);
}

// ─── Main search ─────────────────────────────────────────────────────────────

export interface SearchResults {
  pages: PageResult[];
  clubs: Club[];
  players: Array<Player & { club_name: string; is_injured: boolean; is_suspended: boolean }>;
  news: News[];
}

export async function search(query: string): Promise<SearchResults> {
  const empty: SearchResults = { pages: [], clubs: [], players: [], news: [] };
  if (!query || query.trim().length < 2) return empty;

  const q = query.trim();
  const supabase = await createClient();

  // Round 1: all base queries in parallel
  const [divisionsRes, clubsRes, playersRes, newsRes] = await Promise.all([
    supabase.from('divisions').select('label, slug').order('id'),

    supabase
      .from('clubs')
      .select('*')
      .or(`name.ilike.%${q}%,short_name.ilike.%${q}%`)
      .limit(8),

    (() => {
      const parts = q.split(/\s+/).filter(Boolean);
      let filter = `first_name.ilike.%${q}%,last_name.ilike.%${q}%`;
      if (parts.length >= 2) {
        filter += `,and(first_name.ilike.%${parts[0]}%,last_name.ilike.%${parts.slice(1).join(' ')}%)`;
      }
      return supabase
        .from('players')
        .select('*, club:clubs(name)')
        .or(filter)
        .limit(10);
    })(),

    supabase
      .from('news')
      .select('*')
      .eq('is_published', true)
      .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`)
      .limit(6),
  ]);

  const divisions = divisionsRes.data ?? [];
  const pages = matchPages(q, divisions);
  const rawPlayers = playersRes.data ?? [];

  // Round 2: injuries + suspensions for found player IDs
  const playerIds = rawPlayers.map((p: any) => p.id);
  const [injuriesRes, suspensionsRes] = playerIds.length > 0
    ? await Promise.all([
        supabase
          .from('player_injuries')
          .select('player_id')
          .in('player_id', playerIds)
          .eq('is_active', true),
        supabase
          .from('player_suspensions')
          .select('player_id')
          .in('player_id', playerIds),
      ])
    : [{ data: [] }, { data: [] }];

  const injuredIds = new Set((injuriesRes.data ?? []).map((r: any) => r.player_id));
  const suspendedIds = new Set((suspensionsRes.data ?? []).map((r: any) => r.player_id));

  const players = rawPlayers.map((p: any) => ({
    ...p,
    club_name: p.club?.name ?? '',
    is_injured: injuredIds.has(p.id),
    is_suspended: suspendedIds.has(p.id),
  }));

  return {
    pages,
    clubs: clubsRes.data ?? [],
    players,
    news: newsRes.data ?? [],
  };
}
