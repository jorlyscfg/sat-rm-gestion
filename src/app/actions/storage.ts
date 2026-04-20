'use server'

import { createInsForgeServerClient } from '@/lib/insforge'
import { getCurrentProfile } from '@/lib/auth-utils'
import { getAuthCookies } from '@/lib/auth'
import type { StorageEntry, DisposalRecord, DisposalDestination } from '@/types'

export async function createStorageEntry(input: {
  taskId?: string
  sourceType: string
  sourceId?: string
  weightKg?: number
  volumeM3?: number
  moisturePct?: number
  notes?: string
}): Promise<{ data: StorageEntry | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile) return { data: null, error: 'Sin permisos' }

  const { data, error } = await insforge.database.from('storage_entries').insert([{
    task_id: input.taskId || null,
    source_type: input.sourceType,
    source_id: input.sourceId || null,
    weight_kg: input.weightKg || null,
    volume_m3: input.volumeM3 || null,
    moisture_pct: input.moisturePct || null,
    notes: input.notes || null,
    status: 'recibido',
    received_by: profile.id,
    organization_id: profile.organization_id || null,
  }]).select().single()

  if (error) return { data: null, error: error.message }
  return { data: data as StorageEntry, error: null }
}

export async function getStorageEntries(filters?: { status?: string; taskId?: string }): Promise<{ data: StorageEntry[] | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  let query = insforge.database.from('storage_entries').select().order('created_at', { ascending: false })
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.taskId) query = query.eq('task_id', filters.taskId)

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data: data as StorageEntry[], error: null }
}

export async function updateStorageEntry(
  id: string,
  updates: Partial<Pick<StorageEntry, 'status' | 'weight_kg' | 'volume_m3' | 'moisture_pct' | 'notes'>>
): Promise<{ data: StorageEntry | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['operador', 'coordinador', 'superadmin', 'gerente'].includes(profile.role)) {
    return { data: null, error: 'Sin permisos' }
  }

  const { data, error } = await insforge.database
    .from('storage_entries')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as StorageEntry, error: null }
}

export async function getStorageStats(): Promise<{ data: Record<string, number> | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const { data, error } = await insforge.database.from('storage_entries').select('status')

  if (error) return { data: null, error: error.message }

  const stats: Record<string, number> = { recibido: 0, secando: 0, listo: 0, despachado: 0, descartado: 0 }
  for (const entry of data) {
    stats[entry.status] = (stats[entry.status] || 0) + 1
  }

  return { data: stats, error: null }
}

export async function createDisposalRecord(input: {
  storageEntryId: string
  destinationId: string
  weightKg?: number
  volumeM3?: number
  vehicleId?: string
  folio?: string
}): Promise<{ data: DisposalRecord | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['operador', 'coordinador', 'superadmin', 'gerente'].includes(profile.role)) {
    return { data: null, error: 'Sin permisos' }
  }

  const { data, error } = await insforge.database.from('disposal_records').insert([{
    storage_entry_id: input.storageEntryId,
    destination_id: input.destinationId,
    weight_kg: input.weightKg || null,
    volume_m3: input.volumeM3 || null,
    vehicle_id: input.vehicleId || null,
    folio: input.folio || null,
    dispatched_by: profile.id,
    organization_id: profile.organization_id || null,
  }]).select().single()

  if (error) return { data: null, error: error.message }

  await insforge.database.from('storage_entries').update({ status: 'despachado' }).eq('id', input.storageEntryId)

  return { data: data as DisposalRecord, error: null }
}

export async function getDisposalRecords(filters?: { destinationId?: string }): Promise<{ data: DisposalRecord[] | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  let query = insforge.database.from('disposal_records').select().order('created_at', { ascending: false })
  if (filters?.destinationId) query = query.eq('destination_id', filters.destinationId)

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data: data as DisposalRecord[], error: null }
}

export async function getDisposalDestinations(): Promise<{ data: DisposalDestination[] | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const { data, error } = await insforge.database.from('disposal_destinations').select().eq('is_active', true)

  if (error) return { data: null, error: error.message }
  return { data: data as DisposalDestination[], error: null }
}