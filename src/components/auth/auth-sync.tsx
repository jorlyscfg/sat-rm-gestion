'use client'

import { useEffect, useRef } from 'react'
import { createInsForgeClient } from '@/lib/insforge'
import { logger } from '@/lib/logger'

const SYNC_INTERVAL = 5 * 60 * 1000

export function AuthSync() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    logger.debug('[AuthSync] Initializing interval sync')
    intervalRef.current = setInterval(async () => {
      try {
        logger.debug('[AuthSync] Checking session refresh...')
        const insforge = createInsForgeClient()
        const { data: refreshData, error: refreshError } = await insforge.auth.refreshSession()

        if (refreshError || !refreshData?.accessToken) {
          logger.warn('[AuthSync] Session refresh failed or no token. Clearing cookies and redirecting.', refreshError)
          await fetch('/api/auth/set-cookies', { method: 'DELETE' }).catch(() => {})
          window.location.href = '/auth/sign-in'
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
  }, [])

  return null
}