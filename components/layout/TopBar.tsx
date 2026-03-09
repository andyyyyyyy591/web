import Link from 'next/link';

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-11 items-center justify-between bg-card border-b border-border px-4">
      <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-app text-xs font-black">
          LF
        </div>
        <span className="text-sm font-bold text-primary tracking-wide">Liga Fútbol</span>
      </Link>
      <Link href="/buscar" className="flex h-8 w-8 items-center justify-center rounded-full text-secondary hover:text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </Link>
    </header>
  );
}
