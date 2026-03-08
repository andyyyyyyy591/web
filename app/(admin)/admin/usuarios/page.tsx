import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/utils/auth';
import { listAdminUsers } from '@/lib/actions/users';
import { getClubs } from '@/lib/queries/clubs';
import { AdminUsersClient } from './AdminUsersClient';

export default async function AdminUsuariosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!isSuperAdmin(user)) redirect('/admin');

  const [usersResult, clubs] = await Promise.all([
    listAdminUsers(),
    getClubs(),
  ]);

  const users = usersResult.data ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Usuarios admin</h1>
      <AdminUsersClient users={users} clubs={clubs} />
    </div>
  );
}
