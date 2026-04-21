'use client'

import { useEffect } from 'react'

export function PWARegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then((success) => {
            if (success) console.log('SW unregistered successfully')
          })
        }
      })
    }
  }, [])

  return null
}
