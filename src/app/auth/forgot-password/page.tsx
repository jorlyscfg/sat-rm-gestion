'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createInsForgeClient } from '@/lib/insforge'

type Step = 'email' | 'otp' | 'done'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const insforge = createInsForgeClient()
      const { error: sendError } = await insforge.auth.sendResetPasswordEmail({ email })

      if (sendError) {
        setError(`Error: ${sendError.message}`)
        return
      }

      setStep('otp')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const insforge = createInsForgeClient()
      const { error: resetError } = await insforge.auth.resetPassword({
        otp,
        newPassword,
      })

      if (resetError) {
        setError(`Error: ${resetError.message}`)
        return
      }

      setStep('done')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'otp') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-teal-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 text-center">Restablecer contraseña</h2>
            <p className="text-sm text-zinc-500 mt-2 text-center">
              Ingresa el código enviado a <strong>{email}</strong> y tu nueva contraseña.
            </p>

            {error && (
              <div className="mt-3 p-3 text-sm text-red-700 bg-red-50 rounded-lg">{error}</div>
            )}

            <form onSubmit={handleResetPassword} className="mt-4 space-y-3">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full px-3 py-3 border border-zinc-300 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Código OTP"
                autoFocus
              />
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Nueva contraseña (mínimo 6 caracteres)"
              />
              <button
                type="submit"
                disabled={loading || otp.length !== 6 || newPassword.length < 6}
                className="w-full py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
              </button>
            </form>

            <p className="text-center text-sm text-zinc-500 mt-3">
              <Link href="/auth/sign-in" className="text-teal-600 font-medium hover:underline">Volver a iniciar sesión</Link>
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
            <h2 className="text-lg font-semibold text-zinc-900">Contraseña restablecida</h2>
            <p className="text-sm text-zinc-500 mt-2">Tu contraseña ha sido cambiada exitosamente.</p>
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Recuperar contraseña</h1>
          <p className="text-sm text-zinc-500 mt-1">Te enviaremos un código a tu correo</p>
        </div>

        <form onSubmit={handleSendEmail} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 shadow-sm">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar código'}
          </button>

          <p className="text-center text-sm text-zinc-500">
            <Link href="/auth/sign-in" className="text-teal-600 font-medium hover:underline">Volver a iniciar sesión</Link>
          </p>
        </form>
      </div>
    </div>
  )
}