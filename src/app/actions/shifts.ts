'use server'

import { createInsForgeServerClient } from '@/lib/insforge'
import { getCurrentProfile } from '@/lib/auth-utils'
import { getAuthCookies } from '@/lib/auth'
import type { Shift, ShiftMember, ManagementReport } from '@/types'

export async function createShift(input: {
  date: string
  type: string
  scheduledStart?: string
  scheduledEnd?: string
}): Promise<{ data: Shift | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente', 'coordinador'].includes(profile.role)) {
    return { data: null, error: 'Sin permisos' }
  }

  const { data, error } = await insforge.database.from('shifts').insert([{
    coordinator_id: profile.id,
    date: input.date,
    type: input.type,
    status: 'programado',
    scheduled_start: input.scheduledStart || null,
    scheduled_end: input.scheduledEnd || null,
    organization_id: profile.organization_id || null,
  }]).select().single()

  if (error) return { data: null, error: error.message }
  return { data: data as Shift, error: null }
}

export async function getShifts(filters?: { status?: string }): Promise<{ data: Shift[] | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  let query = insforge.database
    .from('shifts')
    .select('*, coordinator:profiles!shifts_coordinator_id_fkey(id, name, role)')
    .order('date', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data: data as Shift[], error: null }
}

export async function startShift(id: string): Promise<{ data: Shift | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente', 'coordinador'].includes(profile.role)) {
    return { data: null, error: 'Sin permisos' }
  }

  const { data, error } = await insforge.database.from('shifts').update({
    status: 'activo',
    actual_start: new Date().toISOString(),
  }).eq('id', id).select().single()

  if (error) return { data: null, error: error.message }
  return { data: data as Shift, error: null }
}

export async function completeShift(id: string): Promise<{ data: Shift | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente', 'coordinador'].includes(profile.role)) {
    return { data: null, error: 'Sin permisos' }
  }

  const { data: shift } = await insforge.database.from('shifts').select().eq('id', id).single()
  if (!shift) return { data: null, error: 'Turno no encontrado' }

  const [tasks, marine, beach, storage, disposal, members] = await Promise.all([
    insforge.database.from('tasks').select('status').gte('created_at', shift.actual_start || shift.scheduled_start || shift.date),
    insforge.database.from('marine_collections').select('volume_m3').gte('created_at', shift.actual_start || shift.scheduled_start || shift.date),
    insforge.database.from('beach_trips').select('volume_m3').gte('created_at', shift.actual_start || shift.scheduled_start || shift.date),
    insforge.database.from('storage_entries').select('weight_kg, volume_m3').gte('created_at', shift.actual_start || shift.scheduled_start || shift.date),
    insforge.database.from('disposal_records').select().gte('created_at', shift.actual_start || shift.scheduled_start || shift.date),
    insforge.database.from('shift_members').select().eq('shift_id', id),
  ])

  const summary = {
    tasks_completed: tasks.data?.filter((t: { status: string }) => t.status === 'completada').length || 0,
    marine_cycles: marine.data?.length || 0,
    marine_volume_m3: marine.data?.reduce((s: number, c: { volume_m3: number | null }) => s + (c.volume_m3 || 0), 0) || 0,
    beach_trips: beach.data?.length || 0,
    beach_volume_m3: beach.data?.reduce((s: number, t: { volume_m3: number | null }) => s + (t.volume_m3 || 0), 0) || 0,
    storage_entries: storage.data?.length || 0,
    storage_weight_kg: storage.data?.reduce((s: number, e: { weight_kg: number | null }) => s + (e.weight_kg || 0), 0) || 0,
    disposals: disposal.data?.length || 0,
    member_count: members.data?.length || 0,
  }

  const { data, error } = await insforge.database.from('shifts').update({
    status: 'completado',
    actual_end: new Date().toISOString(),
    summary,
  }).eq('id', id).select().single()

  if (error) return { data: null, error: error.message }
  return { data: data as Shift, error: null }
}

export async function addShiftMember(shiftId: string, profileId: string): Promise<{ data: ShiftMember | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente', 'coordinador'].includes(profile.role)) {
    return { data: null, error: 'Sin permisos' }
  }

  const { data, error } = await insforge.database.from('shift_members').insert([{
    shift_id: shiftId,
    profile_id: profileId,
  }]).select().single()

  if (error) return { data: null, error: error.message }
  return { data: data as ShiftMember, error: null }
}

export async function removeShiftMember(shiftId: string, profileId: string): Promise<{ error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente', 'coordinador'].includes(profile.role)) {
    return { error: 'Sin permisos' }
  }

  const { error } = await insforge.database.from('shift_members').delete().eq('shift_id', shiftId).eq('profile_id', profileId)
  return { error: error?.message || null }
}

export async function getManagementReport(fromDate?: string, toDate?: string): Promise<{ data: ManagementReport | null; error: string | null }> {
  const { accessToken } = await getAuthCookies()
  if (!accessToken) return { data: null, error: 'No autenticado' }

  const insforge = createInsForgeServerClient(accessToken)
  const profile = await getCurrentProfile()
  if (!profile || !['superadmin', 'gerente', 'coordinador', 'gerente'].includes(profile.role)) {
    return { data: null, error: 'Sin permisos' }
  }

  let taskQuery = insforge.database.from('tasks').select('status')
  let marineQuery = insforge.database.from('marine_collections').select('volume_m3').eq('status', 'completado')
  let beachQuery = insforge.database.from('beach_trips').select('volume_m3').eq('status', 'completado')
  let storageQuery = insforge.database.from('storage_entries').select('weight_kg, volume_m3')
  let disposalQuery = insforge.database.from('disposal_records').select('destination_id')

  if (fromDate) {
    taskQuery = taskQuery.gte('created_at', fromDate)
    storageQuery = storageQuery.gte('created_at', fromDate)
    disposalQuery = disposalQuery.gte('created_at', fromDate)
  }
  if (toDate) {
    taskQuery = taskQuery.lte('created_at', toDate)
    storageQuery = storageQuery.lte('created_at', toDate)
    disposalQuery = disposalQuery.lte('created_at', toDate)
  }

  const [tasks, marine, beach, storage, disposal] = await Promise.all([
    taskQuery,
    marineQuery,
    beachQuery,
    storageQuery,
    disposalQuery,
  ])

  const totalTasks = tasks.data?.length || 0
  const completed = tasks.data?.filter(t => t.status === 'completada').length || 0
  const cancelled = tasks.data?.filter(t => t.status === 'cancelada').length || 0

  const destCounts: Record<string, number> = {}
  for (const d of disposal.data || []) {
    destCounts[d.destination_id] = (destCounts[d.destination_id] || 0) + 1
  }

  const destinations = await insforge.database.from('disposal_destinations').select()

  return {
    data: {
      tasks: {
        total: totalTasks,
        completed,
        cancelled,
        completion_rate: totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0,
        avg_response_time_hours: 0,
      },
      operations: {
        marine_cycles: marine.data?.length || 0,
        marine_volume_m3: marine.data?.reduce((s: number, c: { volume_m3: number | null }) => s + (c.volume_m3 || 0), 0) || 0,
        beach_trips: beach.data?.length || 0,
        beach_volume_m3: beach.data?.reduce((s: number, t: { volume_m3: number | null }) => s + (t.volume_m3 || 0), 0) || 0,
        total_volume_m3: (marine.data?.reduce((s: number, c: { volume_m3: number | null }) => s + (c.volume_m3 || 0), 0) || 0) + (beach.data?.reduce((s: number, t: { volume_m3: number | null }) => s + (t.volume_m3 || 0), 0) || 0),
      },
      storage: {
        entries: storage.data?.length || 0,
        total_weight_kg: storage.data?.reduce((s: number, e: { weight_kg: number | null }) => s + (e.weight_kg || 0), 0) || 0,
        total_volume_m3: storage.data?.reduce((s: number, e: { volume_m3: number | null }) => s + (e.volume_m3 || 0), 0) || 0,
      },
      disposal: {
        total: disposal.data?.length || 0,
        by_destination: (destinations.data || []).map((d: { id: string; name: string }) => ({
          name: d.name,
          count: destCounts[d.id] || 0,
        })),
      },
      shifts: { total: 0, total_assignments: 0 },
    },
    error: null,
  }
}