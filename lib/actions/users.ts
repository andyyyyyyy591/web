'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/utils/auth';

/** Lista todos los usuarios con rol admin o team_admin */
export async function listAdminUsers() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isSuperAdmin(user)) return { error: 'No autorizado' };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) return { error: error.message };

  const admins = data.users
    .filter((u) => u.app_metadata?.role === 'admin' || u.app_metadata?.role === 'team_admin')
    .map((u) => ({
      id: u.id,
      email: u.email ?? '',
      role: u.app_metadata?.role as string,
      club_id: u.app_metadata?.club_id ?? null,
      created_at: u.created_at,
    }));

  return { data: admins };
}

/** Crea un nuevo usuario team_admin con email, contraseña y club asignado */
export async function createTeamAdmin(email: string, password: string, clubId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isSuperAdmin(user)) return { error: 'No autorizado' };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    app_metadata: { role: 'team_admin', club_id: clubId },
    email_confirm: true,
  });
  if (error) return { error: error.message };
  return { data };
}

/** Actualiza el club asignado a un team_admin */
export async function updateTeamAdminClub(userId: string, clubId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isSuperAdmin(user)) return { error: 'No autorizado' };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: 'team_admin', club_id: clubId },
  });
  if (error) return { error: error.message };
  return { success: true };
}

/** Elimina un usuario admin */
export async function deleteAdminUser(userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isSuperAdmin(user)) return { error: 'No autorizado' };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  return { success: true };
}
