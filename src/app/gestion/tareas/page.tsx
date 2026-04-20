'use client'

import { useEffect, useState } from 'react'
import { getTasks } from '@/app/actions/tasks'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/layout/bottom-nav'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/status-badge'
import { CompactSelect } from '@/components/ui/select'
import { TASK_TYPE_LABELS, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_STATUS_COLORS, TASK_PRIORITY_COLORS, ZONE_LABELS, ZONE_COLORS } from '@/lib/utils'
import type { Task, TaskType, TaskStatus } from '@/types'

const taskTypes: TaskType[] = ['barrera_despliegue', 'colecta_marina', 'limpieza_playa', 'acopio_recepcion', 'disposicion', 'inspeccion']
const taskStatuses: TaskStatus[] = ['pendiente', 'asignada', 'en_progreso', 'completada', 'cancelada', 'escalada']

export default function TareasPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [search, setSearch] = useState('')
  const router = useRouter()

  async function loadTasks() {
    const result = await getTasks({
      status: filterStatus || undefined,
      type: filterType || undefined,
    })
    if (result.data) {
      setTasks(result.data)
    }
    setLoading(false)
  }

  useEffect(() => { loadTasks() }, [filterStatus, filterType])

  const filtered = search
    ? tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()))
    : tasks

  return (
    <div className="flex-1 pt-14 pb-20">
      <div className="px-4 py-3 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar tareas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
          <Link
            href="/gestion/tareas/nueva"
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
          >
            Nueva
          </Link>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <CompactSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: '', label: 'Todos los estados' },
              ...taskStatuses.map(s => ({ value: s, label: TASK_STATUS_LABELS[s] })),
            ]}
          />
          <CompactSelect
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: '', label: 'Todos los tipos' },
              ...taskTypes.map(t => ({ value: t, label: TASK_TYPE_LABELS[t] })),
            ]}
          />
        </div>
      </div>

      {loading ? (
        <div className="px-4 py-8 text-center text-sm text-zinc-500">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-zinc-500">No se encontraron tareas</div>
      ) : (
        <div className="px-4 space-y-2">
          {filtered.map(task => (
            <button
              key={task.id}
              onClick={() => router.push(`/gestion/tareas/${task.id}`)}
              className="w-full bg-white rounded-xl border border-zinc-200 p-4 text-left hover:border-teal-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-zinc-900 truncate">{task.title}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{TASK_TYPE_LABELS[task.type]}</p>
                </div>
                <StatusBadge label={TASK_STATUS_LABELS[task.status]} colorClass={TASK_STATUS_COLORS[task.status]} />
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <StatusBadge label={TASK_PRIORITY_LABELS[task.priority]} colorClass={TASK_PRIORITY_COLORS[task.priority]} />
                {task.zone && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ZONE_COLORS[task.zone] || 'bg-zinc-100 text-zinc-600'}`}>
                    {ZONE_LABELS[task.zone]}
                  </span>
                )}
                {task.assigned_profile && (
                  <span className="text-xs text-zinc-500">· {task.assigned_profile.name}</span>
                )}
                {task.task_assets && task.task_assets.length > 0 && (
                  <span className="flex items-center gap-0.5 ml-1">
                    {task.task_assets.slice(0, 3).map(({ asset }, idx) => {
                      if (!asset) return null;
                      return (
                      <span key={asset.id || idx} title={asset.name} className="text-sm">
                        {asset.type === 'embarcacion' ? '🚤' : asset.type === 'camion' ? '🚛' : '🛻'}
                      </span>
                    )})}
                    {task.task_assets.length > 3 && (
                      <span className="text-[10px] text-zinc-400">+{task.task_assets.length - 3}</span>
                    )}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  )
}