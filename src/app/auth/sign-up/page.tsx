'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createInsForgeClient } from '@/lib/insforge'

type Step = 'form' | 'verify' | 'done'

export default function SignUpPage() {
  const [step, setStep] = useState<Step>('form')
  const [name, setName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const insforge = createInsForgeClient()
      const { data, error: authError } = await insforge.auth.signUp({
        email,
        password,
        name: organizationName ? `${name} | ${organizationName}` : name,
        redirectTo: `${window.location.origin}/auth/sign-in`,
      })

      if (authError) {
        if (authError.statusCode === 409 || authError.message?.toLowerCase().includes('already')) {
          setError('Este correo ya está registrado. Intenta iniciar sesión.')
        } else {
          setError(`Error al registrarse: ${authError.message}`)
        }
        return
      }

      if (data?.requireEmailVerification) {
        setStep('verify')
      } else if (data?.accessToken) {
        const res = await fetch('/api/auth/set-cookies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: data.accessToken, refreshToken: data.refreshToken || '' }),
        })
        if (res.ok) {
          window.location.href = '/'
        } else {
          setError('Error al guardar sesión. Intenta iniciar sesión manualmente.')
        }
      } else {
        setError('Respuesta inesperada del servidor.')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const insforge = createInsForgeClient()
      const { data, error: verifyError } = await insforge.auth.verifyEmail({ email, otp })

      if (verifyError) {
        setError(`Código incorrecto: ${verifyError.message}`)
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
      }

      setStep('done')
    } catch {
      setError('Error al verificar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setError('')
    try {
      const insforge = createInsForgeClient()
      const { error } = await insforge.auth.resendVerificationEmail({
        email,
        redirectTo: `${window.location.origin}/auth/sign-in`,
      })
      if (error) {
        setError(`Error al reenviar: ${error.message}`)
      }
    } catch {
      setError('Error de conexión al reenviar código.')
    }
  }

  if (step === 'verify') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-teal-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.616a2.25 2.25 0 01-2.36 0L1.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 text-center">Verifica tu correo</h2>
            <p className="text-sm text-zinc-500 mt-2 text-center">
              Ingresa el código de 6 dígitos enviado a <strong>{email}</strong>
            </p>

            {error && (
              <div className="mt-3 p-3 text-sm text-red-700 bg-red-50 rounded-lg">{error}</div>
            )}

            <form onSubmit={handleVerify} className="mt-4 space-y-3">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full px-3 py-3 border border-zinc-300 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="000000"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Verificar'}
              </button>
            </form>

            <button
              onClick={handleResend}
              className="w-full mt-3 py-2 text-sm text-teal-600 hover:underline"
            >
              Reenviar código
            </button>

            <p className="text-center text-sm text-zinc-500 mt-3">
              <Link href="/auth/sign-in" className="text-teal-600 font-medium hover:underline">Ir a Iniciar Sesión</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            </div>
            <h2 className="text-lg font-semibold text-zinc-900">Cuenta verificada</h2>
            <p className="text-sm text-zinc-500 mt-2">Tu cuenta ha sido verificada. Ya puedes iniciar sesión.</p>
            <Link href="/auth/sign-in" className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    )
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
          <p className="text-sm text-zinc-500 mt-1">Crear cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 shadow-sm">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre completo</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoComplete="name"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre de tu Organización (Opcional)</label>
            <input
              type="text"
              value={organizationName}
              onChange={e => setOrganizationName(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Ej. Mi Empresa S.A."
            />
            <p className="text-[10px] text-zinc-400 mt-1">Si creas una organización, serás el Administrador principal.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                minLength={6}
                autoComplete="new-password"
                className="w-full px-3 py-2 pr-10 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Mínimo 6 caracteres"
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
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>

          <p className="text-center text-sm text-zinc-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/sign-in" className="text-teal-600 font-medium hover:underline">Iniciar Sesión</Link>
          </p>
        </form>
      </div>
    </div>
  )
}