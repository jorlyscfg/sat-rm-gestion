'use server'

import { createInsForgeServerClient } from '@/lib/insforge'
import { getCurrentProfile } from '@/lib/auth-utils'
import { getAuthCookies } from '@/lib/auth'
import type { MarineCollection, BeachTrip } from '@/types'

export async function startMarineCollection(input: {
  taskId: string
  assetId?: string
}): Promise<{ data: MarineCollection | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile) return { data: null, error: 'Sin permisos' }

  const { data, error } = await insforge.database.from('marine_collections').insert([{
    task_id: input.taskId,
    asset_id: input.assetId || null,
    status: 'en_curso',
    start_time: new Date().toISOString(),
    created_by: profile.id,
    organization_id: profile.organization_id || null,
  }]).select().single()

  if (error) return { data: null, error: error.message }

  await insforge.database.from('tasks').update({ status: 'en_progreso' }).eq('id', input.taskId)

  return { data: data as MarineCollection, error: null }
}

export async function completeMarineCollection(
  id: string,
  volumeM3: number
): Promise<{ data: MarineCollection | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)

  const { data, error } = await insforge.database.from('marine_collections').update({
    status: 'completado',
    end_time: new Date().toISOString(),
    volume_m3: volumeM3,
  }).eq('id', id).select().single()

  if (error) return { data: null, error: error.message }
  return { data: data as MarineCollection, error: null }
}

export async function cancelMarineCollection(
  id: string
): Promise<{ data: MarineCollection | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)

  const { data, error } = await insforge.database.from('marine_collections').update({
    status: 'cancelado',
    end_time: new Date().toISOString(),
  }).eq('id', id).select().single()

  if (error) return { data: null, error: error.message }
  return { data: data as MarineCollection, error: null }
}

export async function getMarineCollections(taskId: string): Promise<{ data: MarineCollection[] | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const { data, error } = await insforge.database.from('marine_collections').select().eq('task_id', taskId).order('created_at')

  if (error) return { data: null, error: error.message }
  return { data: data as MarineCollection[], error: null }
}

export async function getActiveMarineCollection(profileId: string): Promise<{ data: MarineCollection | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const { data, error } = await insforge.database
    .from('marine_collections')
    .select()
    .eq('created_by', profileId)
    .eq('status', 'en_curso')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) return { data: null, error: error.message }
  return { data: (data?.[0] as MarineCollection) || null, error: null }
}

export async function getActiveBeachTrip(profileId: string): Promise<{ data: BeachTrip | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const { data, error } = await insforge.database
    .from('beach_trips')
    .select()
    .eq('created_by', profileId)
    .eq('status', 'en_curso')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) return { data: null, error: error.message }
  return { data: (data?.[0] as BeachTrip) || null, error: null }
}

export async function startBeachTrip(input: {
  taskId: string
  assetId?: string
}): Promise<{ data: BeachTrip | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile) return { data: null, error: 'Sin permisos' }

  const { data, error } = await insforge.database.from('beach_trips').insert([{
    task_id: input.taskId,
    asset_id: input.assetId || null,
    status: 'en_curso',
    start_time: new Date().toISOString(),
    created_by: profile.id,
    organization_id: profile.organization_id || null,
  }]).select().single()

  if (error) return { data: null, error: error.message }

  await insforge.database.from('tasks').update({ status: 'en_progreso' }).eq('id', input.taskId)

  return { data: data as BeachTrip, error: null }
}

export async function completeBeachTrip(
  id: string,
  volumeM3: number
): Promise<{ data: BeachTrip | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)

  const { data, error } = await insforge.database.from('beach_trips').update({
    status: 'completado',
    end_time: new Date().toISOString(),
    volume_m3: volumeM3,
  }).eq('id', id).select().single()

  if (error) return { data: null, error: error.message }
  return { data: data as BeachTrip, error: null }
}

export async function cancelBeachTrip(
  id: string
): Promise<{ data: BeachTrip | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)

  const { data, error } = await insforge.database.from('beach_trips').update({
    status: 'cancelado',
    end_time: new Date().toISOString(),
  }).eq('id', id).select().single()

  if (error) return { data: null, error: error.message }
  return { data: data as BeachTrip, error: null }
}

export async function getBeachTrips(taskId: string): Promise<{ data: BeachTrip[] | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const { data, error } = await insforge.database.from('beach_trips').select().eq('task_id', taskId).order('created_at')

  if (error) return { data: null, error: error.message }
  return { data: data as BeachTrip[], error: null }
}

export async function getTaskOperationSummary(taskId: string) {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)

  const [marine, beach] = await Promise.all([
    insforge.database.from('marine_collections').select().eq('task_id', taskId).eq('status', 'completado'),
    insforge.database.from('beach_trips').select().eq('task_id', taskId).eq('status', 'completado'),
  ])

  return {
    data: {
      marineCycles: marine.data?.length || 0,
      marineVolume: marine.data?.reduce((sum: number, c: MarineCollection) => sum + (c.volume_m3 || 0), 0) || 0,
      beachTrips: beach.data?.length || 0,
      beachVolume: beach.data?.reduce((sum: number, t: BeachTrip) => sum + (t.volume_m3 || 0), 0) || 0,
    },
    error: null,
  }
}