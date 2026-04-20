export type UserRole = 'superadmin' | 'gerente' | 'coordinador' | 'operador' | 'gerencia' | 'operador_mar' | 'operador_playa' | 'operador_tierra'

export interface Organization {
  id: string
  name: string
  slug: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type TaskType = 'barrera_despliegue' | 'colecta_marina' | 'limpieza_playa' | 'acopio_recepcion' | 'disposicion' | 'inspeccion'

export type TaskStatus = 'pendiente' | 'asignada' | 'en_progreso' | 'completada' | 'cancelada' | 'escalada'

export type TaskPriority = 'baja' | 'media' | 'alta' | 'urgente'

export type AssetType = 'embarcacion' | 'atv' | 'pickup' | 'camion'

export type AssetStatus = 'sin_operador' | 'disponible' | 'en_uso' | 'mantenimiento' | 'fuera_de_servicio'

export type BarrierType = 'flotante' | 'fija' | 'mixta'

export type BarrierStatus = 'almacenada' | 'desplegada' | 'mantenimiento' | 'dañada'

export type CollectionStatus = 'en_curso' | 'completado' | 'cancelado'

export type StorageEntryStatus = 'recibido' | 'secando' | 'listo' | 'despachado' | 'descartado'

export type SourceType = 'colecta_marina' | 'viaje_playa' | 'manual'

export type ShiftType = 'matutino' | 'vespertino' | 'nocturno' | 'especial'

export type ShiftStatus = 'programado' | 'activo' | 'completado' | 'cancelado'

export interface Profile {
  id: string
  user_id: string
  name: string
  role: UserRole
  phone?: string
  is_active: boolean
  organization_id?: string
  organization?: Organization
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  organization_id?: string
  name: string
  description?: string
  latitude?: number
  longitude?: number
  work_area: [number, number][]
  contact_email?: string
  contact_phone?: string
  contact_address?: string
  is_active: boolean
  zone?: string
  created_at: string
  updated_at: string
}

export interface CollectionPoint {
  id: string
  organization_id?: string
  name: string
  description?: string
  latitude?: number
  longitude?: number
  work_area: [number, number][]
  contact_email?: string
  contact_phone?: string
  contact_address?: string
  capacity_m3?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description?: string
  type: TaskType
  status: TaskStatus
  priority: TaskPriority
  location?: string
  latitude?: number
  longitude?: number
  assigned_to?: string
  created_by: string
  scheduled_at?: string
  completed_at?: string
  client_id?: string
  client?: Client
  origin_collection_point_id?: string
  destination_collection_point_id?: string
  organization_id?: string
  created_at: string
  updated_at: string
  zone?: string
  task_assets?: TaskAsset[]
  task_barriers?: TaskBarrier[]
  assigned_profile?: Profile
  created_by_profile?: Profile
  origin_collection_point?: CollectionPoint
  destination_collection_point?: CollectionPoint
}

export interface TaskLog {
  id: string
  task_id: string
  status_from?: TaskStatus
  status_to: TaskStatus
  changed_by: string
  note?: string
  created_at: string
  changer_profile?: Profile
}

export interface DisposalDestination {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AlertRule {
  id: string
  name: string
  description?: string
  conditions: Record<string, unknown>
  actions: Record<string, unknown>
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  name: string
  type: AssetType
  status: AssetStatus
  capacity?: number
  description?: string
  metadata?: Record<string, unknown>
  current_task_id?: string | null
  organization_id?: string
  image_urls?: string[]
  created_at: string
  updated_at: string
  asset_operators?: AssetOperator[]
  task_assets?: TaskAsset[]
}

export interface TaskAsset {
  task_id: string
  asset_id: string
  assigned_at: string
  asset?: Asset
  task?: Task
}

export interface TaskBarrier {
  task_id: string
  barrier_id: string
  assigned_at: string
  barrier?: Barrier
  task?: Task
}

export interface AssetOperator {
  asset_id: string
  profile_id: string
  assigned_at: string
  profile?: Profile
  asset?: Asset
}

export interface Barrier {
  id: string
  name: string
  type: BarrierType
  status: BarrierStatus
  length_m?: number
  latitude?: number
  longitude?: number
  description?: string
  image_urls?: string[]
  created_at: string
  updated_at: string
}

export interface MarineCollection {
  id: string
  task_id: string
  asset_id?: string
  status: CollectionStatus
  start_latitude?: number
  start_longitude?: number
  start_time: string
  end_latitude?: number
  end_longitude?: number
  end_time?: string
  volume_m3?: number
  notes?: string
  created_by: string
  created_at: string
}

export interface BeachTrip {
  id: string
  task_id: string
  asset_id?: string
  status: CollectionStatus
  origin_latitude?: number
  origin_longitude?: number
  start_time: string
  destination_latitude?: number
  destination_longitude?: number
  end_time?: string
  volume_m3?: number
  notes?: string
  created_by: string
  created_at: string
}

export interface StorageEntry {
  id: string
  task_id?: string
  source_type: SourceType
  source_id?: string
  weight_kg?: number
  volume_m3?: number
  moisture_pct?: number
  status: StorageEntryStatus
  notes?: string
  received_by: string
  created_at: string
  updated_at: string
}

export interface DisposalRecord {
  id: string
  storage_entry_id: string
  destination_id: string
  weight_kg?: number
  volume_m3?: number
  vehicle_id?: string
  folio?: string
  dispatched_by: string
  created_at: string
}

export interface Shift {
  id: string
  coordinator_id: string
  date: string
  type: ShiftType
  status: ShiftStatus
  scheduled_start?: string
  scheduled_end?: string
  actual_start?: string
  actual_end?: string
  summary?: ShiftSummary
  created_at: string
  updated_at: string
  coordinator?: Profile
  members?: ShiftMember[]
}

export interface ShiftMember {
  id: string
  shift_id: string
  profile_id: string
  role_override?: string
  created_at: string
  profile?: Profile
}

export interface ShiftSummary {
  tasks_completed: number
  marine_cycles: number
  marine_volume_m3: number
  beach_trips: number
  beach_volume_m3: number
  storage_entries: number
  storage_weight_kg: number
  disposals: number
  member_count: number
}

export interface ManagementReport {
  tasks: {
    total: number
    completed: number
    cancelled: number
    completion_rate: number
    avg_response_time_hours: number
  }
  operations: {
    marine_cycles: number
    marine_volume_m3: number
    beach_trips: number
    beach_volume_m3: number
    total_volume_m3: number
  }
  storage: {
    entries: number
    total_weight_kg: number
    total_volume_m3: number
  }
  disposal: {
    total: number
    by_destination: { name: string; count: number }[]
  }
  shifts: {
    total: number
    total_assignments: number
  }
}