import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAdminRole, getAdminClubId } from './auth';

/** Obtiene usuario + rol + clubId. Redirige a /login si no autenticado. */
export async function getAdminContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const role = getAdminRole(user);
  const clubId = getAdminClubId(user);
  return { user, role, clubId, isSuperAdmin: role === 'admin', isTeamAdmin: role === 'team_admin' };
}

/** Redirige a /admin si el usuario es team_admin (página solo para super admin). */
export async function requireSuperAdmin() {
  const ctx = await getAdminContext();
  if (!ctx.isSuperAdmin) redirect('/admin');
  return ctx;
}

/** Redirige a /admin si team_admin intenta acceder a recursos de otro club. */
export async function requireOwnClub(clubId: string) {
  const ctx = await getAdminContext();
  if (ctx.isTeamAdmin && ctx.clubId !== clubId) redirect('/admin');
  return ctx;
}
