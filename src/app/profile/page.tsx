import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth-utils'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ROLE_LABELS } from '@/lib/utils'

export default async function ProfilePage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/sign-in')

  return (
    <div className="flex-1 pt-14 pb-20">
      <div className="px-4 pt-4 space-y-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
              <span className="text-lg font-bold text-teal-700">{profile.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">{profile.name}</h2>
              <p className="text-sm text-teal-600">{ROLE_LABELS[profile.role]}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Teléfono</span>
              <span className="text-zinc-900">{profile.phone || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Estado</span>
              <span className={profile.is_active ? 'text-green-600' : 'text-red-600'}>
                {profile.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}