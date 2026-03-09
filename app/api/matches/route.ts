import { NextResponse } from 'next/server';
import { getMatchesByDate, getLiveMatchesWithClubs } from '@/lib/queries/matches';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // ?live=true → devuelve todos los partidos en curso sin importar fecha
  if (searchParams.get('live') === 'true') {
    const matches = await getLiveMatchesWithClubs();
    return NextResponse.json(matches);
  }

  const date = searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
  }
  const matches = await getMatchesByDate(date);
  return NextResponse.json(matches);
}
