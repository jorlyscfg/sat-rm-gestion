'use server'

import { createInsForgeServerClient } from '@/lib/insforge'
import { getCurrentProfile } from '@/lib/auth-utils'
import { getAuthCookies } from '@/lib/auth'
import type { Organization } from '@/types'

export async function createOrganization(name: string, slug: string): Promise<{ data: Organization | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'superadmin') {
    return { data: null, error: 'Sin permisos' }
  }

  const { data, error } = await insforge.database.from('organizations').insert([{
    name,
    slug,
    is_active: true,
  }]).select().single()

  if (error) return { data: null, error: error.message }
  return { data: data as Organization, error: null }
}

export async function getOrganizations(): Promise<{ data: Organization[] | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)

  const profile = await getCurrentProfile()
  if (!profile) return { data: null, error: 'Sin permisos' }

  if (profile.role === 'superadmin') {
    const { data, error } = await insforge.database.from('organizations').select().order('name')
    if (error) return { data: null, error: error.message }
    return { data: data as Organization[], error: null }
  }

  if (profile.organization_id) {
    const { data, error } = await insforge.database.from('organizations').select().eq('id', profile.organization_id)
    if (error) return { data: null, error: error.message }
    return { data: data as Organization[], error: null }
  }

  return { data: [], error: null }
}

export async function updateOrganization(id: string, updates: Partial<Organization>): Promise<{ data: Organization | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'superadmin') {
    return { data: null, error: 'Sin permisos' }
  }

  const { data, error } = await insforge.database
    .from('organizations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Organization, error: null }
}

export async function assignProfileToOrganization(profileId: string, organizationId: string): Promise<{ error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente', 'coordinador'].includes(profile.role)) {
    return { error: 'Sin permisos' }
  }

  const { error } = await insforge.database
    .from('profiles')
    .update({ organization_id: organizationId })
    .eq('id', profileId)

  return { error: error?.message || null }
}

export async function getMyOrganization(): Promise<{ data: Organization | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !profile.organization_id) {
    return { data: null, error: 'Usuario no pertenece a ninguna organización' }
  }

  const { data, error } = await insforge.database
    .from('organizations')
    .select()
    .eq('id', profile.organization_id)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Organization, error: null }
}

export async function deleteOrganizationAndAllData(id: string): Promise<{ error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  
  if (!profile || !['superadmin', 'gerente'].includes(profile.role)) {
    return { error: 'Sin permisos para realizar esta acción' }
  }

  if (profile.role === 'gerente' && profile.organization_id !== id) {
    return { error: 'Solo puedes eliminar tu propia organización' }
  }

  const { error } = await insforge.database.rpc('delete_organization_cascade', { target_org_id: id })

  return { error: error?.message || null }
}