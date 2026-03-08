import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminLayoutClient } from '@/components/layout/AdminLayoutClient';
import { getAdminRole, getAdminClubId } from '@/lib/utils/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const role = getAdminRole(user);
  const clubId = getAdminClubId(user);

  return (
    <AdminLayoutClient role={role} clubId={clubId} userEmail={user.email ?? ''}>
      {children}
    </AdminLayoutClient>
  );
}
