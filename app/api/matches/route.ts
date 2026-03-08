import { NextResponse } from 'next/server';
import { getMatchesByDate } from '@/lib/queries/matches';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
  }
  const matches = await getMatchesByDate(date);
  return NextResponse.json(matches);
}
