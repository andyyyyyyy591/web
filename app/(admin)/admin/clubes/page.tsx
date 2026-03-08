import Link from 'next/link';
import Image from 'next/image';
import { getClubs } from '@/lib/queries/clubs';
import { Button } from '@/components/ui/Button';
import { requireSuperAdmin } from '@/lib/utils/admin-guard';

export default async function AdminClubesPage() {
  await requireSuperAdmin();
  const clubs = await getClubs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Clubes</h1>
        <Link href="/admin/clubes/nuevo">
          <Button>+ Nuevo club</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clubs.map((club) => (
          <div
            key={club.id}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            {club.logo_url ? (
              <Image src={club.logo_url} alt={club.name} width={40} height={40} className="h-10 w-10 rounded-full object-contain" />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: club.primary_color }}
              >
                {club.short_name?.[0] ?? club.name[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate font-semibold text-slate-800">{club.name}</p>
              {club.short_name && (
                <p className="text-xs text-slate-400">{club.short_name}</p>
              )}
            </div>
            <Link
              href={`/admin/clubes/${club.id}`}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              Editar
            </Link>
          </div>
        ))}
        {clubs.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-slate-400">Sin clubes registrados</p>
        )}
      </div>
    </div>
  );
}
