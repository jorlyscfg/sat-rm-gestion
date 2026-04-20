'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createInsForgeClient } from '@/lib/insforge'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const insforge = createInsForgeClient()
      const { data, error: authError } = await insforge.auth.signInWithPassword({ email, password })

      if (authError) {
        if (authError.statusCode === 403) {
          setError('Tu correo no ha sido verificado. Revisa tu bandeja de entrada para el código de verificación.')
        } else {
          setError('Correo o contraseña incorrectos')
        }
        return
      }

      if (data?.accessToken) {
        const res = await fetch('/api/auth/set-cookies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: data.accessToken, refreshToken: data.refreshToken || '' }),
        })

        if (res.ok) {
          window.location.href = '/'
          return
        }

        setError('Error al establecer la sesión. Intenta de nuevo.')
      } else {
        setError('No se recibieron credenciales de acceso')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-teal-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.96 11.96 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">SATS-RM</h1>
          <p className="text-sm text-zinc-500 mt-1">Gestión Operativa de Sargazo</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Iniciar Sesión</h2>

          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2 pr-10 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.413 16.19 7.743 19 12 19c.993 0 1.954-.138 2.87-.396M6.228 6.228A10.45 10.45 0 0112 5c4.257 0 8.587 2.81 10.066 7-.346.974-.835 1.886-1.443 2.71M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 5 12 5c4.638 0 8.573 2.51 10.963 6.322a1.012 1.012 0 010 .639C20.577 16.49 16.64 19 12 19c-4.638 0-8.573-2.51-10.964-6.322z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>

          <div className="text-center">
            <Link href="/auth/forgot-password" className="text-sm text-zinc-500 hover:text-teal-600 hover:underline">¿Olvidaste tu contraseña?</Link>
          </div>

          <p className="text-center text-sm text-zinc-500">
            ¿No tienes cuenta?{' '}
            <Link href="/auth/sign-up" className="text-teal-600 font-medium hover:underline">Registrarse</Link>
          </p>
        </form>
      </div>
    </div>
  )
}