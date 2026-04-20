'use client'

import { useRouter } from 'next/navigation'

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const { createInsForgeClient } = await import('@/lib/insforge')
    const insforge = createInsForgeClient()
    await insforge.auth.signOut()
    await fetch('/api/auth/set-cookies', { method: 'DELETE' })
    router.push('/auth/sign-in')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
    >
      Cerrar Sesión
    </button>
  )
}