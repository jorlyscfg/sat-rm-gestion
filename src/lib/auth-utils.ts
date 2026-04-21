import { cache } from 'react'
import { cookies } from 'next/headers'
import { createInsForgeServerClient } from './insforge'
import type { UserRole, Profile } from '@/types'
import { logger } from './logger'

export const getCurrentUser = cache(async () => {
  const accessToken = (await cookies()).get('insforge_access_token')?.value
  if (!accessToken) {
    logger.debug('[AuthUtils] No access token found in cookies')
    return null
  }

  try {
    const insforge = createInsForgeServerClient(accessToken)
    const { data, error } = await insforge.auth.getCurrentUser()
    
    if (error) {
      logger.debug('[AuthUtils] Session token invalid or expired')
      return null
    }

    if (!data?.user) {
      logger.warn('[AuthUtils] No user data returned from insforge')
      return null
    }

    return data.user
  } catch (err) {
    logger.error('[AuthUtils] Unexpected error in getCurrentUser', err)
    return null
  }
})

export const getCurrentProfile = cache(async (): Promise<(Profile & { role: UserRole }) | null> => {
  const user = await getCurrentUser()
  if (!user) return null

  const accessToken = (await cookies()).get('insforge_access_token')?.value
  if (!accessToken) return null

  try {
    const insforge = createInsForgeServerClient(accessToken)
    const { data, error } = await insforge.database
      .from('profiles')
      .select()
      .eq('user_id', user.id)
      .single()

    if (error) {
      logger.error('[AuthUtils] Error fetching profile', { error, userId: user.id })
      return null
    }

    if (!data) {
      logger.warn('[AuthUtils] No profile found for user', { userId: user.id })
      return null
    }

    return data as Profile & { role: UserRole }
  } catch (err) {
    logger.error('[AuthUtils] Unexpected error in getCurrentProfile', err)
    return null
  }
})

export function canAccess(profile: Profile & { role: UserRole }, roles: UserRole[]): boolean {
  return roles.includes(profile.role)
}

export function isAdmin(profile: Profile & { role: UserRole }): boolean {
  return ['superadmin', 'gerente', 'coordinador'].includes(profile.role)
}

export function isOrgAdmin(profile: Profile & { role: UserRole }): boolean {
  return ['superadmin', 'gerente', 'coordinador'].includes(profile.role)
}