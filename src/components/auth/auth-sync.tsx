'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { createInsForgeClient } from '@/lib/insforge'
import { logger } from '@/lib/logger'

const SYNC_INTERVAL = 5 * 60 * 1000

export function AuthSync() {
  const pathname = usePathname()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const isAuthPage = pathname.startsWith('/auth')
    if (isAuthPage) return

    logger.debug('[AuthSync] Initializing interval sync')
    intervalRef.current = setInterval(async () => {
      try {
        const insforge = createInsForgeClient()
        
        logger.debug('[AuthSync] Attempting background session refresh...')
        const { data: refreshData, error: refreshError } = await insforge.auth.refreshSession()

        if (refreshError || !refreshData?.accessToken) {
          // No hacemos nada si falla. Si la sesión realmente expiró,
          // las Server Actions o el Middleware se encargarán de redirigir.
          logger.debug('[AuthSync] Background refresh skipped or failed (likely no client-side session).')
          return
        }

        logger.info('[AuthSync] Session refreshed successfully. Updating cookies.')
        await fetch('/api/auth/set-cookies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: refreshData.accessToken,
            refreshToken: refreshData.refreshToken || '',
          }),
        })
      } catch (err) {
        logger.error('[AuthSync] Unexpected error during session sync', err)
      }
    }, SYNC_INTERVAL)

    return () => {
      logger.debug('[AuthSync] Cleaning up interval sync')
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [pathname])

  return null
}