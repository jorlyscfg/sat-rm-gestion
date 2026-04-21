'use server'

import { createInsForgeServerClient } from '@/lib/insforge'
import { getCurrentProfile } from '@/lib/auth-utils'
import { getAuthCookies } from '@/lib/auth'
import type { Asset } from '@/types'
import { logger } from '@/lib/logger'

export async function getAssets(filters?: { type?: string; types?: string[]; status?: string }): Promise<{ data: Asset[] | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  let query = insforge.database
    .from('assets')
    .select('*, assigned_operator:profiles!assets_assigned_operator_id_fkey(id, name, role, latitude, longitude)')
    .order('name')

  if (filters?.types && filters.types.length > 0) query = query.in('type', filters.types)
  else if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  
  if (error) return { data: null, error: error.message }
  return { data: data as Asset[], error: null }
}

export async function getAssetById(id: string): Promise<{ data: Asset | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const { data, error } = await insforge.database.from('assets').select().eq('id', id).single()

  if (error) return { data: null, error: error.message }
  return { data: data as Asset, error: null }
}

export async function createAsset(input: {
  name: string
  type: string
  status?: string
  capacity?: number
  description?: string
  image_urls?: string[]
}): Promise<{ data: Asset | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente'].includes(profile.role)) {
    return { data: null, error: 'Sin permisos' }
  }

  const { data, error } = await insforge.database.from('assets').insert([{
    name: input.name,
    type: input.type,
    status: input.status || 'sin_operador',
    capacity: input.capacity || null,
    description: input.description || null,
    image_urls: input.image_urls || [],
    organization_id: profile.organization_id || null,
  }]).select().single()

  if (error) return { data: null, error: error.message }
  return { data: data as Asset, error: null }
}

export async function updateAsset(id: string, updates: Partial<Asset>): Promise<{ data: Asset | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente', 'coordinador'].includes(profile.role)) {
    return { data: null, error: 'Sin permisos' }
  }

  const cleanUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      cleanUpdates[key] = value === '' ? null : value
    }
  }

  const { data, error } = await insforge.database
    .from('assets')
    .update(cleanUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Asset, error: null }
}

export async function getAvailableAssets(type?: string): Promise<{ data: Asset[] | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile) return { data: null, error: 'Sin permisos' }

  let query = insforge.database
    .from('assets')
    .select('*, task_assets(task_id, tasks(status))')
    .eq('status', 'disponible')
    .not('assigned_operator_id', 'is', null)

  if (profile.role !== 'superadmin') {
    if (!profile.organization_id) return { data: [], error: null }
    query = query.eq('organization_id', profile.organization_id)
  }

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getAvailableAssets] DB Error:', error.message)
    return { data: null, error: error.message }
  }

  // Filter out assets that are assigned to an active task
  const activeStatuses = ['pendiente', 'asignada', 'en_progreso']
  const availableAssets = (data as any[]).filter(asset => {
    if (!asset.task_assets || asset.task_assets.length === 0) return true
    
    // Check if any of the linked tasks are currently active
    const hasActiveTask = asset.task_assets.some((ta: any) => {
      // If task is null, maybe it was deleted but pivot remained, we ignore it
      const relatedTask = ta.tasks || ta.task;
      if (!relatedTask) return false
      
      // PostgREST might return an array if the relation is ambiguous
      if (Array.isArray(relatedTask)) {
        return relatedTask.some((t: any) => activeStatuses.includes(t.status))
      }
      
      return activeStatuses.includes(relatedTask.status)
    })

    return !hasActiveTask
  })

  return { data: availableAssets as Asset[], error: null }
}

export async function assignOperatorToAsset(
  assetId: string,
  operatorId: string
): Promise<{ error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente'].includes(profile.role)) {
    return { error: 'Sin permisos' }
  }

  const { error } = await insforge.database
    .from('assets')
    .update({
      assigned_operator_id: operatorId,
      status: 'disponible',
      updated_at: new Date().toISOString(),
    })
    .eq('id', assetId)

  return { error: error?.message || null }
}

export async function unassignOperatorFromAsset(
  assetId: string
): Promise<{ error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente'].includes(profile.role)) {
    return { error: 'Sin permisos' }
  }

  const { error } = await insforge.database
    .from('assets')
    .update({
      assigned_operator_id: null,
      status: 'sin_operador',
      updated_at: new Date().toISOString(),
    })
    .eq('id', assetId)

  return { error: error?.message || null }
}

export async function getBarriers(filters?: { status?: string }): Promise<{ data: Asset[] | null; error: string | null }> {
  return getAssets({ type: 'barrera', status: filters?.status })
}

export async function assignAssetToTask(assetId: string, taskId: string): Promise<{ data: Asset | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente', 'coordinador'].includes(profile.role)) {
    return { data: null, error: 'Solo coordinadores y gerentes pueden asignar activos' }
  }

  const { data: asset } = await insforge.database.from('assets').select('status, current_task_id, assigned_operator_id').eq('id', assetId).single()
  if (!asset) return { data: null, error: 'Activo no encontrado' }
  if (asset.status !== 'disponible') return { data: null, error: 'El activo no está disponible' }
  if (!asset.assigned_operator_id) return { data: null, error: 'El activo no tiene un operador asignado' }
  if (asset.current_task_id) return { data: null, error: 'El activo ya está asignado a otra tarea' }

  const { data, error } = await insforge.database
    .from('assets')
    .update({
      status: 'en_uso',
      current_task_id: taskId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assetId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Asset, error: null }
}

export async function releaseAsset(assetId: string): Promise<{ data: Asset | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente', 'coordinador'].includes(profile.role)) {
    return { data: null, error: 'Solo coordinadores y gerentes pueden liberar activos' }
  }

  const { data: asset } = await insforge.database.from('assets').select('current_task_id').eq('id', assetId).single()
  if (!asset) return { data: null, error: 'Activo no encontrado' }

  const { data, error } = await insforge.database
    .from('assets')
    .update({
      status: 'mantenimiento',
      current_task_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assetId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Asset, error: null }
}

export async function reactivateAsset(assetId: string): Promise<{ data: Asset | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente', 'coordinador'].includes(profile.role)) {
    return { data: null, error: 'Solo coordinadores y gerentes pueden reactivar activos' }
  }

  const { data: currentAsset } = await insforge.database.from('assets').select('assigned_operator_id').eq('id', assetId).single()
  const newStatus = currentAsset?.assigned_operator_id ? 'disponible' : 'sin_operador'

  const { data, error } = await insforge.database
    .from('assets')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assetId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Asset, error: null }
}

export async function getBarrierById(id: string): Promise<{ data: Asset | null; error: string | null }> {
  return getAssetById(id)
}

export async function deleteAsset(id: string): Promise<{ error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente'].includes(profile.role)) {
    return { error: 'Sin permisos' }
  }

  // 1. Get asset to find images
  const { data: asset, error: fetchError } = await insforge.database
    .from('assets')
    .select('image_urls, organization_id')
    .eq('id', id)
    .single()

  if (fetchError) return { error: fetchError.message }
  if (profile.role !== 'superadmin' && asset.organization_id !== profile.organization_id) {
    return { error: 'No tienes acceso a este activo' }
  }

  // 2. Delete images from bucket
  if (asset.image_urls && asset.image_urls.length > 0) {
    for (const url of asset.image_urls) {
      const parts = url.split('/assets/')
      const key = parts.length > 1 ? parts[1] : null
      if (key) {
        await insforge.storage.from('assets').remove(key)
      }
    }
  }

  // 3. Delete from database
  const { error: deleteError } = await insforge.database.from('assets').delete().eq('id', id)
  if (deleteError) return { error: deleteError.message }

  return { error: null }
}

export async function deleteBarrier(id: string): Promise<{ error: string | null }> {
  return deleteAsset(id)
}

export async function createBarrier(input: {
  name: string
  type: string
  length_m: number
  description?: string
}): Promise<{ data: Asset | null; error: string | null }> {
  return createAsset({
    ...input,
    type: 'barrera',
    status: 'sin_operador'
  })
}

export async function updateBarrier(id: string, updates: Partial<Asset>): Promise<{ data: Asset | null; error: string | null }> {
  return updateAsset(id, updates)
}