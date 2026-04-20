'use server'

import { createInsForgeServerClient } from '@/lib/insforge'
import { getCurrentProfile } from '@/lib/auth-utils'
import { getAuthCookies } from '@/lib/auth'
import { logger } from '@/lib/logger'
import type { Profile, UserRole } from '@/types'

export async function getUserProfile(): Promise<Profile | null> {
  return await getCurrentProfile()
}

export async function listProfiles(): Promise<{ data: Profile[] | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente', 'coordinador'].includes(profile.role)) {
    return { data: null, error: 'Sin permisos' }
  }

  let query = insforge.database
    .from('profiles')
    .select()
    .eq('is_active', true)

  if (profile.role !== 'superadmin') {
    if (!profile.organization_id) return { data: [], error: null }
    query = query.eq('organization_id', profile.organization_id)
  }

  const { data, error } = await query.order('name')

  if (error) return { data: null, error: error.message }

  return { data: data as Profile[], error: null }
}

export async function createManagedAccount(input: {
  email: string
  password: string
  name: string
  role: UserRole
  phone?: string
  organizationId?: string
}): Promise<{ data: Profile | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const currentProfile = await getCurrentProfile()
  
  if (!currentProfile || !['superadmin', 'gerente', 'gerencia'].includes(currentProfile.role)) {
    return { data: null, error: 'Sin permisos' }
  }

  const orgId = input.organizationId || currentProfile.organization_id || null

  // 1. Sign up (Solo datos base)
  const { error: signUpError } = await (insforge.auth as any).signUp({
    email: input.email,
    password: input.password,
    name: input.name
  })

  if (signUpError) {
    logger.error('[ProfileAction] signUp Error', signUpError)
    return { data: null, error: signUpError.message }
  }
  
  // 2. RPC (Enviamos el email para que la DB busque el ID internamente)
  const { data: resultProfile, error: profileError } = await insforge.database
    .rpc('create_managed_profile', {
      p_name: input.name,
      p_role: input.role,
      p_phone: input.phone || null,
      p_org_id: orgId,
      p_email: input.email
    })
    .select()
    .single()

  if (profileError) {
    logger.error('[ProfileAction] RPC Error', profileError)
    return { data: null, error: profileError.message }
  }

  return { data: resultProfile as Profile, error: null }
}







export async function updateProfile(
  id: string,
  updates: Partial<Pick<Profile, 'name' | 'phone' | 'role' | 'is_active'>>
): Promise<{ data: Profile | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const currentProfile = await getCurrentProfile()
  if (!currentProfile) return { data: null, error: 'Sin permisos' }

  const canEdit = currentProfile.role === 'superadmin' ||
    currentProfile.role === 'gerente' ||
    currentProfile.role === 'coordinador' ||
    currentProfile.id === id

  if (!canEdit) return { data: null, error: 'Sin permisos' }

  const { data, error } = await insforge.database
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  return { data: data as Profile, error: null }
}

export async function deleteProfile(id: string): Promise<{ error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const currentProfile = await getCurrentProfile()
  if (!currentProfile) return { error: 'Sin permisos' }

  const canEdit = currentProfile.role === 'superadmin' ||
    currentProfile.role === 'gerente'

  if (!canEdit) return { error: 'Sin permisos para eliminar' }

  const { data: targetProfile, error: getError } = await insforge.database
    .from('profiles')
    .select('user_id')
    .eq('id', id)
    .single()

  if (getError || !targetProfile) return { error: 'Perfil no encontrado' }

  const { error: rpcError } = await insforge.database
    .rpc('delete_managed_user', { target_user_id: targetProfile.user_id })

  if (rpcError) {
    logger.error('[ProfileAction] Error deleting user via RPC', rpcError)
    return { error: 'No se pudo eliminar el usuario de la plataforma' }
  }

  return { error: null }
}

export async function getAssignableProfiles(): Promise<{ data: Profile[] | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile) return { data: null, error: 'Sin permisos' }

  let query = insforge.database
    .from('profiles')
    .select()
    .in('role', ['operador', 'coordinador'])
    .eq('is_active', true)

  if (profile.role !== 'superadmin') {
    if (!profile.organization_id) return { data: [], error: null }
    query = query.eq('organization_id', profile.organization_id)
  }

  const { data, error } = await query.order('name')

  if (error) return { data: null, error: error.message }
  return { data: data as Profile[], error: null }
}

export async function getProfilesByRole(role: UserRole): Promise<{ data: Profile[] | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente', 'coordinador'].includes(profile.role)) {
    return { data: null, error: 'Sin permisos' }
  }

  let query = insforge.database
    .from('profiles')
    .select()
    .eq('role', role)
    .eq('is_active', true)

  if (profile.role !== 'superadmin') {
    if (!profile.organization_id) return { data: [], error: null }
    query = query.eq('organization_id', profile.organization_id)
  }

  const { data, error } = await query.order('name')

  if (error) return { data: null, error: error.message }

  return { data: data as Profile[], error: null }
}