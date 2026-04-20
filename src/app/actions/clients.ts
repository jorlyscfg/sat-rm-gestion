'use server'

import { createInsForgeServerClient } from '@/lib/insforge'
import { getCurrentProfile } from '@/lib/auth-utils'
import { getAuthCookies } from '@/lib/auth'
import type { Client } from '@/types'

export async function getClients(filters?: { isActive?: boolean }): Promise<{ data: Client[] | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile) return { data: null, error: 'Perfil no encontrado' }

  let query = insforge.database.from('clients').select().order('name')
  
  // Enforce isolation
  if (profile.role !== 'superadmin') {
    query = query.eq('organization_id', profile.organization_id)
  }

  if (filters?.isActive !== undefined) query = query.eq('is_active', filters.isActive)

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data: data as Client[], error: null }
}

export async function getClientById(id: string): Promise<{ data: Client | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile) return { data: null, error: 'Perfil no encontrado' }

  let query = insforge.database.from('clients').select().eq('id', id)
  
  // Enforce isolation
  if (profile.role !== 'superadmin') {
    query = query.eq('organization_id', profile.organization_id)
  }

  const { data, error } = await query.single()

  if (error) return { data: null, error: error.message }
  return { data: data as Client, error: null }
}

export async function createClient(input: {
  name: string
  description?: string
  latitude?: number
  longitude?: number
  workArea?: [number, number][]
  contactEmail?: string
  contactPhone?: string
  contactAddress?: string
}): Promise<{ data: Client | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente'].includes(profile.role)) {
    return { data: null, error: 'Sin permisos' }
  }

  const { data, error } = await insforge.database.from('clients').insert([{
    organization_id: profile.organization_id || null,
    name: input.name,
    description: input.description || null,
    latitude: input.latitude || null,
    longitude: input.longitude || null,
    work_area: input.workArea || [],
    contact_email: input.contactEmail || null,
    contact_phone: input.contactPhone || null,
    contact_address: input.contactAddress || null,
    is_active: true,
  }]).select().single()

  if (error) return { data: null, error: error.message }
  return { data: data as Client, error: null }
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<{ data: Client | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente'].includes(profile.role)) {
    return { data: null, error: 'Sin permisos' }
  }

  // Security: check if client belongs to the organization
  if (profile.role !== 'superadmin') {
    const { data: existing } = await insforge.database
      .from('clients')
      .select('organization_id')
      .eq('id', id)
      .single()
    if (!existing || existing.organization_id !== profile.organization_id) {
      return { data: null, error: 'No tienes acceso a este cliente' }
    }
  }

  const cleanUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const fieldMap: Record<string, string> = {
    name: 'name',
    description: 'description',
    latitude: 'latitude',
    longitude: 'longitude',
    is_active: 'is_active',
    contactEmail: 'contact_email',
    contactPhone: 'contact_phone',
    contactAddress: 'contact_address',
    workArea: 'work_area',
  }

  for (const [key, dbKey] of Object.entries(fieldMap)) {
    if ((updates as Record<string, unknown>)[key] !== undefined) {
      cleanUpdates[dbKey] = (updates as Record<string, unknown>)[key]
    }
  }

  const { data, error } = await insforge.database
    .from('clients')
    .update(cleanUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Client, error: null }
}

export async function deleteClient(id: string): Promise<{ error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente'].includes(profile.role)) {
    return { error: 'Sin permisos' }
  }

  // Security check
  if (profile.role !== 'superadmin') {
    const { data: existing } = await insforge.database
      .from('clients')
      .select('organization_id')
      .eq('id', id)
      .single()
    if (!existing || existing.organization_id !== profile.organization_id) {
      return { error: 'No tienes acceso a este cliente' }
    }
  }

  const { error } = await insforge.database.from('clients').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id)
  return { error: error?.message || null }
}