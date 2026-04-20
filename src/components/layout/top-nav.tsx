'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const routeTitles: Record<string, string> = {
  '/': 'Inicio',
  '/gestion/tareas': 'Tareas',
  '/gestion/tareas/nueva': 'Nueva Tarea',
  '/gestion/activos': 'Activos',
  '/gestion/operaciones/mar': 'Colecta Marina',
  '/gestion/operaciones/playa': 'Limpieza Playa',
  '/gestion/operaciones/tierra': 'Acopio y Disposición',
  '/gestion/turnos': 'Turnos',
  '/gestion/reportes': 'Reportes',
  '/profile': 'Perfil',
  '/mapa': 'Mapa',
  '/alertas': 'Alertas',
}

export function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [signingOut, setSigningOut] = useState(false)

  const isAuthPage = pathname.startsWith('/auth')
  if (isAuthPage) return null

  const title = routeTitles[pathname] || routeTitles[pathname.replace(/\/\d+$/, '')] || 'SATS-RM'

  async function handleSignOut() {
    setSigningOut(true)
    try {
      const { createInsForgeClient } = await import('@/lib/insforge')
      const insforge = createInsForgeClient()
      await insforge.auth.signOut()
      await fetch('/api/auth/set-cookies', { method: 'DELETE' })
      router.push('/auth/sign-in')
      router.refresh()
    } catch {
      router.push('/auth/sign-in')
      router.refresh()
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200 bg-white safe-area-top">
      <div className="flex items-center justify-between h-14 max-w-lg mx-auto px-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 shrink-0 rounded-lg bg-teal-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.96 11.96 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-zinc-900 truncate">{title}</span>
        </div>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          {signingOut ? 'Saliendo...' : 'Salir'}
        </button>
      </div>
    </header>
  )
}