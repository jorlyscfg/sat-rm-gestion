'use client'

import { createContext, useContext } from 'react'
import type { Profile, UserRole } from '@/types'

type SessionProfile = (Profile & { role: UserRole }) | null

const SessionContext = createContext<SessionProfile>(null)

export function SessionProvider({ profile, children }: { profile: SessionProfile; children: React.ReactNode }) {
  return (
    <SessionContext.Provider value={profile}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSessionProfile() {
  return useContext(SessionContext)
}