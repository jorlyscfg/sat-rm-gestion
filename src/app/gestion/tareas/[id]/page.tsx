import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth-utils'
import { getTaskById } from '@/app/actions/tasks'
import { BottomNav } from '@/components/layout/bottom-nav'
import { StatusBadge } from '@/components/ui/status-badge'
import { TASK_TYPE_LABELS, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_STATUS_COLORS, TASK_PRIORITY_COLORS, ZONE_LABELS, ZONE_COLORS, ASSET_TYPE_LABELS, formatDate } from '@/lib/utils'
import { TaskActions } from './task-actions'
import { OperationControls } from '@/components/ui/operation-controls'

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/sign-in')

  const { id } = await params
  const { data: task } = await getTaskById(id)

  if (!task) {
    return (
      <div className="flex-1 pt-14 pb-20">
        <div className="px-4 py-8 text-center text-zinc-500">La tarea no existe o no tienes acceso.</div>
        <BottomNav />
      </div>
    )
  }

  const canAssign = ['superadmin', 'gerente', 'coordinador'].includes(profile.role)
  const canChangeStatus = canAssign || task.assigned_to === profile.id

  return (
    <div className="flex-1 pt-14 pb-20">
      <div className="px-4 py-3 space-y-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-lg font-semibold text-zinc-900">{task.title}</h1>
            <StatusBadge label={TASK_STATUS_LABELS[task.status]} colorClass={TASK_STATUS_COLORS[task.status]} />
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StatusBadge label={TASK_PRIORITY_LABELS[task.priority]} colorClass={TASK_PRIORITY_COLORS[task.priority]} />
            <span className="text-xs text-zinc-500">{TASK_TYPE_LABELS[task.type]}</span>
            {task.zone && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ZONE_COLORS[task.zone] || 'bg-zinc-100 text-zinc-600'}`}>
                {ZONE_LABELS[task.zone]}
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-sm text-zinc-600 mt-3">{task.description}</p>
          )}

          {task.client && (
            <p className="text-sm font-medium text-zinc-700 mt-3">Cliente: {task.client.name}</p>
          )}

          {task.location && (
            <p className="text-sm text-zinc-500 mt-2 flex items-center gap-1">
              <span>📍</span> {task.location}
            </p>
          )}

          {task.task_assets && task.task_assets.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-100">
              <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Activos Asignados</h3>
              <div className="grid grid-cols-1 gap-2">
                {task.task_assets.map(({ asset }) => (
                  <div key={asset.id} className="flex items-center gap-3 p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                    <span className="text-base">
                      {asset.type === 'embarcacion' ? '🚤' : asset.type === 'camion' ? '🚛' : '🛻'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-zinc-900">{asset.name}</p>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-wider">{ASSET_TYPE_LABELS[asset.type]}</p>
                    </div>
                    {asset.assigned_operator && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100 font-medium shrink-0">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                        {asset.assigned_operator.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}


          <div className="mt-3 pt-3 border-t border-zinc-100 grid grid-cols-2 gap-y-2 text-xs text-zinc-500">
            <div>Creado: {formatDate(task.created_at)}</div>
            <div>Actualizado: {formatDate(task.updated_at)}</div>
            {task.assigned_profile && (
              <div>Asignado a: {task.assigned_profile.name}</div>
            )}
            {task.created_by_profile && (
              <div>Creado por: {task.created_by_profile.name}</div>
            )}
          </div>
        </div>
        
        {canChangeStatus && (
          <OperationControls task={task} />
        )}

        {canChangeStatus && (
          <TaskActions taskId={task.id} currentStatus={task.status} canAssign={canAssign} />
        )}

        {task.logs && task.logs.length > 0 && (
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">Historial</h2>
            <div className="space-y-3">
              {task.logs.map(log => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs text-zinc-900">
                      {log.status_from ? `${TASK_STATUS_LABELS[log.status_from]} → ` : ''}{TASK_STATUS_LABELS[log.status_to]}
                    </p>
                    {log.note && <p className="text-xs text-zinc-500">{log.note}</p>}
                    <p className="text-xs text-zinc-400">{formatDate(log.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}