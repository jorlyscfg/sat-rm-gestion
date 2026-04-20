import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth-utils'
import { getTaskStats } from '@/app/actions/tasks'
import { BottomNav } from '@/components/layout/bottom-nav'
import { StatCard } from '@/components/ui/stat-card'
import Link from 'next/link'

export default async function HomePage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/sign-in')

  if (['operador_mar', 'operador_playa', 'operador_tierra', 'operador'].includes(profile.role)) {
    redirect('/gestion/tareas')
  }

  const { data: stats } = await getTaskStats()

  return (
    <div className="flex-1 pt-14 pb-20">
      <div className="px-4 pt-4 grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Pendientes" value={stats?.pendiente || 0} color="text-yellow-600" />
        <StatCard label="Asignadas" value={stats?.asignada || 0} color="text-blue-600" />
        <StatCard label="En Progreso" value={stats?.en_progreso || 0} color="text-orange-600" />
        <StatCard label="Completadas" value={stats?.completada || 0} color="text-green-600" />
        <StatCard label="Canceladas" value={stats?.cancelada || 0} color="text-red-600" />
        <StatCard label="Total" value={stats?.total || 0} />
      </div>

      <div className="px-4 grid grid-cols-2 gap-3">
        <Link href="/gestion/tareas" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-zinc-200 hover:border-teal-300 transition-colors">
          <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
          <span className="text-sm font-medium text-zinc-900">Tareas</span>
        </Link>

        <Link href="/gestion/activos" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-zinc-200 hover:border-teal-300 transition-colors">
          <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h3.75L7.5 6H3.375" /></svg>
          <span className="text-sm font-medium text-zinc-900">Activos</span>
        </Link>


        <Link href="/gestion/clientes" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-zinc-200 hover:border-teal-300 transition-colors">
          <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.18-.576-5.917-1.58A6.003 6.003 0 008.25 16.5c0-1.152.26-2.243.722-3.222C9.56 10.836 10.68 9.75 12 9.75c.83 0 1.578.358 2.148.948M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-sm font-medium text-zinc-900">Clientes</span>
        </Link>

        <Link href="/gestion/acopio" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-zinc-200 hover:border-orange-300 transition-colors">
          <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          <span className="text-sm font-medium text-zinc-900">Acopio</span>
        </Link>

        <Link href="/gestion/turnos" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-zinc-200 hover:border-teal-300 transition-colors">
          <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-sm font-medium text-zinc-900">Turnos</span>
        </Link>

        <Link href="/gestion/reportes" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-zinc-200 hover:border-teal-300 transition-colors">
          <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.125C9.75 7.504 10.254 7 10.875 7h2.25c.621 0 1.125.504 1.125 1.125v11.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.125zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
          <span className="text-sm font-medium text-zinc-900">Reportes</span>
        </Link>

        {['superadmin', 'gerente', 'gerencia'].includes(profile.role) && (
          <Link href="/gestion/configuracion" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-zinc-200 hover:border-teal-300 transition-colors">
            <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 1115 0 7.5 7.5 0 01-15 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9" /></svg>
            <span className="text-sm font-medium text-zinc-900">Configuración</span>
          </Link>
        )}
      </div>

      <BottomNav />
    </div>
  )
}