'use client'

import { useState } from 'react'
import { BARRIER_TYPE_LABELS } from '@/lib/utils'
import type { TaskBarrier, Client } from '@/types'
import { BarrierDeploymentModal } from './barrier-deployment-modal'

interface BarrierListProps {
  taskBarriers: TaskBarrier[]
  client?: Client
  canDeploy: boolean
}

export function BarrierList({ taskBarriers, client, canDeploy }: BarrierListProps) {
  const [selectedBarrier, setSelectedBarrier] = useState<TaskBarrier | null>(null)

  if (!taskBarriers || taskBarriers.length === 0) return null

  return (
    <div className="mt-4 pt-4 border-t border-zinc-100">
      <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Barreras Asignadas</h3>
      <div className="space-y-2">
        {taskBarriers.map(({ barrier }, idx) => {
          if (!barrier) return null
          
          const isDeployed = barrier.status === 'desplegada'
          const workArea = (client?.work_area || []) as [number, number][]

          return (
            <div key={barrier.id || idx} className="flex flex-col gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <div className="flex items-center gap-3">
                <span className="text-xl">🚧</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-zinc-900">{barrier.name}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                      isDeployed ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isDeployed ? 'Desplegada' : 'Almacenada'}
                    </span>
                  </div>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-wider">
                    {BARRIER_TYPE_LABELS[barrier.type] || barrier.type} {barrier.length_m ? `(${barrier.length_m}m)` : ''}
                  </p>
                </div>

                {canDeploy && (
                  <button
                    onClick={() => setSelectedBarrier({ barrier } as any)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all active:scale-95 ${
                      isDeployed 
                        ? 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300' 
                        : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm'
                    }`}
                  >
                    {isDeployed ? 'Actualizar Posición' : 'Desplegar'}
                  </button>
                )}
              </div>
              
              {isDeployed && barrier.latitude && barrier.longitude && (
                <div className="flex items-center gap-1.5 pl-9 text-[9px] text-zinc-400 font-medium italic">
                  <span className="not-italic">📍</span> {barrier.latitude.toFixed(6)}, {barrier.longitude.toFixed(6)}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selectedBarrier && selectedBarrier.barrier && (
        <BarrierDeploymentModal
          barrier={selectedBarrier.barrier}
          workArea={(client?.work_area || []) as [number, number][]}
          onClose={() => setSelectedBarrier(null)}
        />
      )}
    </div>
  )
}
