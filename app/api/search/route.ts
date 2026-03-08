import { NextResponse } from 'next/server';
import { search } from '@/lib/queries/search';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  if (q.trim().length < 2) {
    return NextResponse.json({ clubs: [], players: [], news: [] });
  }
  try {
    const results = await search(q.trim());
    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ clubs: [], players: [], news: [] });
  }
}
