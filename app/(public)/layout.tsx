import { TopBar } from '@/components/layout/TopBar';
import { BottomNav } from '@/components/layout/BottomNav';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col bg-app" style={{ colorScheme: 'light' }}>
      <TopBar />
      <main className="flex-1 pb-nav-safe min-h-main">{children}</main>
      <BottomNav />
    </div>
  );
}
