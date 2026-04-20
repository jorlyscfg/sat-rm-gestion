'use client'

import { useState } from 'react'
import { updateTaskStatus } from '@/app/actions/tasks'
import { useRouter } from 'next/navigation'
import type { TaskStatus } from '@/types'

const statusTransitions: Record<string, TaskStatus[]> = {
  pendiente: ['asignada', 'cancelada'],
  asignada: ['en_progreso', 'cancelada'],
  en_progreso: ['completada', 'escalada', 'cancelada'],
  escalada: ['asignada', 'cancelada'],
  completada: [],
  cancelada: [],
}

interface TaskActionsProps {
  taskId: string
  currentStatus: string
  canAssign: boolean
}

export function TaskActions({ taskId, currentStatus, canAssign }: TaskActionsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const transitions = statusTransitions[currentStatus] || []

  async function handleStatusChange(newStatus: string) {
    setLoading(true)
    await updateTaskStatus(taskId, newStatus)
    router.refresh()
    setLoading(false)
  }

  if (transitions.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-2">
      <h2 className="text-sm font-semibold text-zinc-900">Acciones</h2>
      <div className="flex flex-wrap gap-2">
        {transitions.map(status => (
          <button
            key={status}
            onClick={() => handleStatusChange(status)}
            disabled={loading}
            className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 bg-teal-600 text-white hover:bg-teal-700"
          >
            {status === 'asignada' && 'Asignar'}
            {status === 'en_progreso' && 'Iniciar'}
            {status === 'completada' && 'Completar'}
            {status === 'escalada' && 'Escalar'}
            {status === 'cancelada' && 'Cancelar'}
          </button>
        ))}
      </div>
    </div>
  )
}