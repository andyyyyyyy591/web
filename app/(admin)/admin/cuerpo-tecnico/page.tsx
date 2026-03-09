import { createClient } from '@/lib/supabase/server';
import { getAllCoachingStaff, getCoachingStaffByClub } from '@/lib/queries/coaching-staff';
import { getClubs } from '@/lib/queries/clubs';
import { getAdminRole, getAdminClubId } from '@/lib/utils/auth';
import { CoachingStaffClient } from './CoachingStaffClient';

export default async function CuerpoTecnicoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = getAdminRole(user);
  const clubId = getAdminClubId(user);
  const isTeamAdmin = role === 'team_admin';

  const [staff, clubs] = await Promise.all([
    isTeamAdmin && clubId ? getCoachingStaffByClub(clubId) : getAllCoachingStaff(),
    isTeamAdmin ? Promise.resolve([]) : getClubs(),
  ]);

  return (
    <div className="space-y-5 pb-6">
      <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Cuerpo técnico</h1>
      <CoachingStaffClient
        staff={staff as any}
        clubs={clubs.map((c) => ({ id: c.id, name: c.name }))}
        isTeamAdmin={isTeamAdmin}
        lockedClubId={isTeamAdmin ? (clubId ?? undefined) : undefined}
      />
    </div>
  );
}
