'use client'

import { useEffect } from 'react'

export function PWARegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration)
            // Force update check
            registration.update()
          })
          .catch((registrationError) => {
            console.error('SW registration failed: ', registrationError)
          })
      })
    }
  }, [])

  return null
}
