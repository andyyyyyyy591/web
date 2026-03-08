import type { User } from '@supabase/supabase-js';
import type { AdminRole } from '@/types';

export function getAdminRole(user: User | null): AdminRole | null {
  if (!user) return null;
  const role = user.app_metadata?.role;
  if (role === 'admin' || role === 'team_admin') return role;
  return null;
}

export function isTeamAdmin(user: User | null): boolean {
  return getAdminRole(user) === 'team_admin';
}

export function isSuperAdmin(user: User | null): boolean {
  return getAdminRole(user) === 'admin';
}

export function getAdminClubId(user: User | null): string | null {
  if (!user) return null;
  return user.app_metadata?.club_id ?? null;
}

/** Verifica que el usuario tenga cualquier rol de admin */
export function isAnyAdmin(user: User | null): boolean {
  const role = getAdminRole(user);
  return role === 'admin' || role === 'team_admin';
}
