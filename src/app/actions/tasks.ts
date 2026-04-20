'use server'

import { createInsForgeServerClient } from '@/lib/insforge'
import { getCurrentProfile } from '@/lib/auth-utils'
import { getAuthCookies } from '@/lib/auth'
import type { Task, TaskLog } from '@/types'

interface TaskFilters {
  status?: string
  statuses?: string[]
  type?: string
  types?: string[]
  priority?: string
  assigned_to?: string
  search?: string
}

export async function getTasks(filters?: TaskFilters): Promise<{ data: Task[] | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile) return { data: null, error: 'Sin permisos' }

  let query = insforge.database
    .from('tasks')
    .select('*, assigned_profile:profiles!tasks_assigned_to_fkey(id, name, role), created_by_profile:profiles!tasks_created_by_fkey(id, name, role), task_assets(asset:assets(*, assigned_operator:profiles!assets_assigned_operator_id_fkey(id, name, role))), task_barriers(barrier:barriers(*))')
    .order('created_at', { ascending: false })

  if (filters?.statuses && filters.statuses.length > 0) query = query.in('status', filters.statuses)
  else if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.types && filters.types.length > 0) query = query.in('type', filters.types)
  else if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.priority) query = query.eq('priority', filters.priority)
  if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to)

  if (profile.role === 'operador') {
    query = query.eq('assigned_to', profile.id)
  } else if (profile.role !== 'superadmin') {
    if (!profile.organization_id) return { data: [], error: null }
    query = query.eq('organization_id', profile.organization_id)
  }

  const { data, error } = await query

  if (error) return { data: null, error: error.message }

  let tasks = data as Task[]

  if (filters?.search) {
    const s = filters.search.toLowerCase()
    tasks = tasks.filter(t =>
      t.title.toLowerCase().includes(s) ||
      t.description?.toLowerCase().includes(s)
    )
  }

  return { data: tasks, error: null }
}

export async function getTaskById(id: string): Promise<{ data: (Task & { logs: TaskLog[] }) | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)

  const { data: task, error: taskError } = await insforge.database
    .from('tasks')
    .select('*, assigned_profile:profiles!tasks_assigned_to_fkey(id, name, role), created_by_profile:profiles!tasks_created_by_fkey(id, name, role), client:clients(*), task_assets(asset:assets(*, assigned_operator:profiles!assets_assigned_operator_id_fkey(id, name, role))), task_barriers(barrier:barriers(*)), origin_collection_point:collection_points!tasks_origin_collection_point_id_fkey(id, name), destination_collection_point:collection_points!tasks_destination_collection_point_id_fkey(id, name)')
    .eq('id', id)
    .single()

  if (taskError) return { data: null, error: taskError.message }

  const { data: logs, error: logsError } = await insforge.database
    .from('task_logs')
    .select('*, changer_profile:profiles!task_logs_changed_by_fkey(id, name, role)')
    .eq('task_id', id)
    .order('created_at', { ascending: true })

  if (logsError) return { data: null, error: logsError.message }

  return { data: { ...task, logs: logs as TaskLog[] } as Task & { logs: TaskLog[] }, error: null }
}

export async function createTask(input: {
  title: string
  description?: string
  type: string
  priority: string
  location?: string
  latitude?: number
  longitude?: number
  assigned_to?: string
  scheduled_at?: string
  client_id?: string
  zone?: string
  asset_ids?: string[]
  barrier_ids?: string[]
  origin_collection_point_id?: string
  destination_collection_point_id?: string
}): Promise<{ data: Task | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente', 'coordinador'].includes(profile.role)) {
    return { data: null, error: 'Sin permisos' }
  }

  const status = input.assigned_to ? 'asignada' : 'pendiente'

  // Security: Validate Client and Operator (if assigned) belong to creator's organization
  if (profile.role !== 'superadmin') {
    if (input.client_id) {
       const { data: client } = await insforge.database.from('clients').select('organization_id').eq('id', input.client_id).single()
       if (!client || client.organization_id !== profile.organization_id) {
         return { data: null, error: 'El cliente no pertenece a tu organización' }
       }
    }

    if (input.assigned_to) {
       const { data: targetProfile } = await insforge.database.from('profiles').select('organization_id').eq('id', input.assigned_to).single()
       if (!targetProfile || targetProfile.organization_id !== profile.organization_id) {
         return { data: null, error: 'El operador no pertenece a tu organización' }
       }
    }
  }

  const { data, error } = await insforge.database
    .from('tasks')
    .insert([{
      title: input.title,
      description: input.description || null,
      type: input.type,
      priority: input.priority,
      location: input.location || null,
      latitude: input.latitude || null,
      longitude: input.longitude || null,
      assigned_to: input.assigned_to || null,
      created_by: profile.id,
      client_id: input.client_id || null,
      organization_id: profile.organization_id || null,
      status,
      scheduled_at: input.scheduled_at || null,
      zone: input.zone || null,
      origin_collection_point_id: input.origin_collection_point_id || null,
      destination_collection_point_id: input.destination_collection_point_id || null,
    }])
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  if (input.assigned_to) {
    await insforge.database.from('task_logs').insert([{
      task_id: data!.id,
      status_to: 'asignada',
      changed_by: profile.id,
      note: 'Tarea asignada al crear',
    }])
  } else {
    await insforge.database.from('task_logs').insert([{
      task_id: data!.id,
      status_to: 'pendiente',
      changed_by: profile.id,
      note: 'Tarea creada',
    }])
  }

  if (input.asset_ids && input.asset_ids.length > 0) {
    const assetInserts = input.asset_ids.map(assetId => ({
      task_id: data!.id,
      asset_id: assetId
    }))
    const { error: assetError } = await insforge.database.from('task_assets').insert(assetInserts)
    if (assetError) console.error('[TaskAction] Error linking assets', assetError)
  }

  if (input.barrier_ids && input.barrier_ids.length > 0) {
    const barrierInserts = input.barrier_ids.map(barrierId => ({
      task_id: data!.id,
      barrier_id: barrierId
    }))
    const { error: barrierError } = await insforge.database.from('task_barriers').insert(barrierInserts)
    if (barrierError) console.error('[TaskAction] Error linking barriers', barrierError)
  }

  return { data: data as Task, error: null }
}

export async function updateTaskStatus(
  id: string,
  newStatus: string,
  note?: string
): Promise<{ data: Task | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile) return { data: null, error: 'Sin permisos' }

  const { data: currentTask } = await insforge.database
    .from('tasks')
    .select('status, assigned_to')
    .eq('id', id)
    .single()

  if (!currentTask) return { data: null, error: 'Tarea no encontrada' }

  const updates: Record<string, unknown> = { status: newStatus, updated_at: new Date().toISOString() }
  if (newStatus === 'completada') updates.completed_at = new Date().toISOString()

  const { data, error } = await insforge.database
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  await insforge.database.from('task_logs').insert([{
    task_id: id,
    status_from: currentTask.status,
    status_to: newStatus,
    changed_by: profile.id,
    note: note || null,
  }])

  return { data: data as Task, error: null }
}

export async function assignTask(
  id: string,
  profileId: string
): Promise<{ data: Task | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente', 'coordinador'].includes(profile.role)) {
    return { data: null, error: 'Sin permisos' }
  }

  const { data, error } = await insforge.database
    .from('tasks')
    .update({ assigned_to: profileId, status: 'asignada', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  await insforge.database.from('task_logs').insert([{
    task_id: id,
    status_to: 'asignada',
    changed_by: profile.id,
    note: `Asignada a operador`,
  }])

  return { data: data as Task, error: null }
}

export async function getOperatorTasks(
  profileId: string,
  types?: string[],
  statuses?: string[]
): Promise<{ data: Task[] | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)

  let query = insforge.database
    .from('tasks')
    .select('*, assigned_profile:profiles!tasks_assigned_to_fkey(id, name, role), created_by_profile:profiles!tasks_created_by_fkey(id, name, role)')
    .eq('assigned_to', profileId)
    .order('created_at', { ascending: false })

  if (types && types.length > 0) query = query.in('type', types)
  if (statuses && statuses.length > 0) query = query.in('status', statuses)

  const { data, error } = await query

  if (error) return { data: null, error: error.message }
  return { data: data as Task[], error: null }
}

export async function getTaskStats(): Promise<{ data: Record<string, number> | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile) return { data: null, error: 'Sin permisos' }

  let query = insforge.database
    .from('tasks')
    .select('status')

  if (profile.role === 'operador') {
    query = query.eq('assigned_to', profile.id)
  } else if (profile.role !== 'superadmin') {
    if (!profile.organization_id) return { data: null, error: null }
    query = query.eq('organization_id', profile.organization_id)
  }

  const { data, error } = await query

  if (error) return { data: null, error: error.message }

  const stats: Record<string, number> = {
    pendiente: 0, asignada: 0, en_progreso: 0,
    completada: 0, cancelada: 0, escalada: 0, total: 0,
  }

  for (const task of data) {
    stats[task.status] = (stats[task.status] || 0) + 1
    stats.total++
  }

  return { data: stats, error: null }
}