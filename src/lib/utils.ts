export const TASK_TYPE_LABELS: Record<string, string> = {
  barrera_despliegue: 'Despliegue de Barrera',
  colecta_marina: 'Colecta Marina',
  limpieza_playa: 'Limpieza de Playa',
  acopio_recepcion: 'Recepción en Acopio',
  disposicion: 'Disposición Final',
  inspeccion: 'Inspección',
}

export const TASK_STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  asignada: 'Asignada',
  en_progreso: 'En Progreso',
  completada: 'Completada',
  cancelada: 'Cancelada',
  escalada: 'Escalada',
}

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente',
}

export const TASK_STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-gray-100 text-gray-800',
  asignada: 'bg-blue-100 text-blue-800',
  en_progreso: 'bg-yellow-100 text-yellow-800',
  completada: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
  escalada: 'bg-orange-100 text-orange-800',
}

export const TASK_PRIORITY_COLORS: Record<string, string> = {
  baja: 'bg-gray-100 text-gray-700',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
}

export const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Administrador',
  gerente: 'Gerente',
  coordinador: 'Coordinador',
  operador: 'Operador',
}

export const ASSET_TYPE_LABELS: Record<string, string> = {
  embarcacion: 'Embarcación',
  atv: 'ATV',
  pickup: 'Pickup',
  camion: 'Camión',
}

export const ASSET_STATUS_LABELS: Record<string, string> = {
  sin_operador: 'Sin Operador',
  disponible: 'Disponible',
  en_uso: 'En Uso',
  mantenimiento: 'Mantenimiento',
  fuera_de_servicio: 'Fuera de Servicio',
}

export const BARRIER_STATUS_LABELS: Record<string, string> = {
  almacenada: 'Almacenada',
  desplegada: 'Desplegada',
  mantenimiento: 'Mantenimiento',
  dañada: 'Dañada',
}

export const BARRIER_TYPE_LABELS: Record<string, string> = {
  flotante: 'Flotante',
  fija: 'Fija',
  mixta: 'Mixta',
}

export const ASSET_STATUS_COLORS: Record<string, string> = {
  sin_operador: 'bg-orange-100 text-orange-800',
  disponible: 'bg-green-100 text-green-800',
  en_uso: 'bg-blue-100 text-blue-800',
  mantenimiento: 'bg-yellow-100 text-yellow-800',
  fuera_de_servicio: 'bg-red-100 text-red-800',
}

export const BARRIER_STATUS_COLORS: Record<string, string> = {
  almacenada: 'bg-gray-100 text-gray-800',
  desplegada: 'bg-blue-100 text-blue-800',
  mantenimiento: 'bg-yellow-100 text-yellow-800',
  dañada: 'bg-red-100 text-red-800',
}

export const SHIFT_TYPE_LABELS: Record<string, string> = {
  matutino: 'Matutino',
  vespertino: 'Vespertino',
  nocturno: 'Nocturno',
  especial: 'Especial',
}

export const SHIFT_STATUS_LABELS: Record<string, string> = {
  programado: 'Programado',
  activo: 'Activo',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

export const STORAGE_STATUS_LABELS: Record<string, string> = {
  recibido: 'Recibido',
  secando: 'Secando',
  listo: 'Listo',
  despachado: 'Despachado',
  descartado: 'Descartado',
}

export const STORAGE_STATUS_COLORS: Record<string, string> = {
  recibido: 'bg-blue-100 text-blue-800',
  secando: 'bg-yellow-100 text-yellow-800',
  listo: 'bg-green-100 text-green-800',
  despachado: 'bg-gray-100 text-gray-800',
  descartado: 'bg-red-100 text-red-800',
}

export const COLLECTION_STATUS_LABELS: Record<string, string> = {
  en_curso: 'En Curso',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

export const ZONE_LABELS: Record<string, string> = {
  mar: 'Mar',
  playa: 'Playa',
  tierra: 'Tierra',
}

export const ZONE_COLORS: Record<string, string> = {
  mar: 'bg-blue-50 text-blue-700 border-blue-100',
  playa: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  tierra: 'bg-emerald-50 text-emerald-700 border-emerald-100',
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
  })
}