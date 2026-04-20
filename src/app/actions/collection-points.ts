'use server'

import { createInsForgeServerClient } from '@/lib/insforge'
import { getCurrentProfile } from '@/lib/auth-utils'
import { getAuthCookies } from '@/lib/auth'
import type { CollectionPoint } from '@/types'

export async function getCollectionPoints(
  filters?: { isActive?: boolean }
): Promise<{ data: CollectionPoint[] | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile) return { data: null, error: 'Perfil no encontrado' }

  let query = insforge.database.from('collection_points').select().order('name')

  if (profile.role !== 'superadmin') {
    query = query.eq('organization_id', profile.organization_id)
  }

  if (filters?.isActive !== undefined) query = query.eq('is_active', filters.isActive)

  const { data, error } = await query
  if (error) return { data: null, error: error.message }

  // Normalize work_area from JSONB to [number, number][]
  const points = (data as any[]).map(row => ({
    ...row,
    work_area: Array.isArray(row.work_area) ? row.work_area : [],
  })) as CollectionPoint[]

  return { data: points, error: null }
}

export async function getCollectionPointById(
  id: string
): Promise<{ data: CollectionPoint | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile) return { data: null, error: 'Perfil no encontrado' }

  let query = insforge.database.from('collection_points').select().eq('id', id)

  if (profile.role !== 'superadmin') {
    query = query.eq('organization_id', profile.organization_id)
  }

  const { data, error } = await query.single()
  if (error) return { data: null, error: error.message }

  const point = {
    ...data,
    work_area: Array.isArray((data as any).work_area) ? (data as any).work_area : [],
  } as CollectionPoint

  return { data: point, error: null }
}

export async function createCollectionPoint(input: {
  name: string
  description?: string
  latitude?: number
  longitude?: number
  workArea?: [number, number][]
  contactEmail?: string
  contactPhone?: string
  contactAddress?: string
  capacityM3?: number
}): Promise<{ data: CollectionPoint | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente'].includes(profile.role)) {
    return { data: null, error: 'Sin permisos' }
  }

  const { data, error } = await insforge.database
    .from('collection_points')
    .insert([{
      organization_id: profile.organization_id || null,
      name: input.name,
      description: input.description || null,
      latitude: input.latitude || null,
      longitude: input.longitude || null,
      work_area: input.workArea || [],
      contact_email: input.contactEmail || null,
      contact_phone: input.contactPhone || null,
      contact_address: input.contactAddress || null,
      capacity_m3: input.capacityM3 || null,
      is_active: true,
    }])
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  const point = {
    ...data,
    work_area: Array.isArray((data as any).work_area) ? (data as any).work_area : [],
  } as CollectionPoint

  return { data: point, error: null }
}

export async function updateCollectionPoint(
  id: string,
  updates: Partial<CollectionPoint> & { capacityM3?: number; workArea?: [number, number][] }
): Promise<{ data: CollectionPoint | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente'].includes(profile.role)) {
    return { data: null, error: 'Sin permisos' }
  }

  // Security: check organization_id
  if (profile.role !== 'superadmin') {
    const { data: existing } = await insforge.database
      .from('collection_points')
      .select('organization_id')
      .eq('id', id)
      .single()
    if (!existing || (existing as any).organization_id !== profile.organization_id) {
      return { data: null, error: 'No tienes acceso a este punto de acopio' }
    }
  }

  const cleanUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const fieldMap: Record<string, string> = {
    name: 'name',
    description: 'description',
    latitude: 'latitude',
    longitude: 'longitude',
    is_active: 'is_active',
    contact_email: 'contact_email',
    contact_phone: 'contact_phone',
    contact_address: 'contact_address',
    capacity_m3: 'capacity_m3',
    capacityM3: 'capacity_m3',
    workArea: 'work_area',
    work_area: 'work_area',
  }

  for (const [key, dbKey] of Object.entries(fieldMap)) {
    if ((updates as Record<string, unknown>)[key] !== undefined) {
      cleanUpdates[dbKey] = (updates as Record<string, unknown>)[key]
    }
  }

  const { data, error } = await insforge.database
    .from('collection_points')
    .update(cleanUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  const point = {
    ...data,
    work_area: Array.isArray((data as any).work_area) ? (data as any).work_area : [],
  } as CollectionPoint

  return { data: point, error: null }
}

export async function deleteCollectionPoint(
  id: string
): Promise<{ error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente'].includes(profile.role)) {
    return { error: 'Sin permisos' }
  }

  if (profile.role !== 'superadmin') {
    const { data: existing } = await insforge.database
      .from('collection_points')
      .select('organization_id')
      .eq('id', id)
      .single()
    if (!existing || (existing as any).organization_id !== profile.organization_id) {
      return { error: 'No tienes acceso a este punto de acopio' }
    }
  }

  const { error } = await insforge.database
    .from('collection_points')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  return { error: error?.message || null }
}
