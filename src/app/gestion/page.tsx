import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth-utils'

export default async function GestionPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/sign-in')

  if (profile.role === 'operador_mar') redirect('/gestion/operaciones/mar')
  if (profile.role === 'operador_playa') redirect('/gestion/operaciones/playa')
  if (profile.role === 'operador_tierra') redirect('/gestion/operaciones/tierra')
  if (profile.role === 'operador') redirect('/gestion/tareas')

  redirect('/')
}