'use client'

import { useEffect, useState, useTransition, useCallback } from 'react'
import { useSessionProfile } from '@/components/auth/session-provider'
import { Select } from '@/components/ui/select'
import { ASSET_TYPE_LABELS } from '@/lib/utils'
import type { Task, MarineCollection, BeachTrip, Asset, TaskType } from '@/types'
import * as ops from '@/app/actions/operations'

interface OperationControlsProps {
  task: Task
}

export function OperationControls({ task }: OperationControlsProps) {
  const profile = useSessionProfile()
  const [activeMarineCycle, setActiveMarineCycle] = useState<MarineCollection | null>(null)
  const [activeBeachTrip, setActiveBeachTrip] = useState<BeachTrip | null>(null)
  const [volume, setVolume] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<string>('')
  const [summary, setSummary] = useState({ marineCycles: 0, marineVolume: 0, beachTrips: 0, beachVolume: 0 })
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const loadOperationData = useCallback(async () => {
    if (!profile) return

    const [sumResult, activeMarine, activeBeach] = await Promise.all([
      ops.getTaskOperationSummary(task.id),
      ops.getActiveMarineCollection(profile.id),
      ops.getActiveBeachTrip(profile.id)
    ])

    if (sumResult.data) setSummary(sumResult.data)
    
    // Only set as active if it's for THIS task
    if (activeMarine.data && activeMarine.data.task_id === task.id) {
      setActiveMarineCycle(activeMarine.data)
    } else {
      setActiveMarineCycle(null)
    }

    if (activeBeach.data && activeBeach.data.task_id === task.id) {
      setActiveBeachTrip(activeBeach.data)
    } else {
      setActiveBeachTrip(null)
    }
  }, [profile?.id, task.id])

  useEffect(() => {
    loadOperationData()
  }, [loadOperationData])

  const assets = task.task_assets?.map(ta => ta.asset).filter((a): a is Asset => a !== undefined) || []

  // --- Marine Logic ---
  const handleStartMarine = () => {
    setError('')
    startTransition(async () => {
      const result = await ops.startMarineCollection({
        taskId: task.id,
        assetId: selectedAsset || undefined
      })
      if (result.error) setError(result.error)
      else loadOperationData()
    })
  }

  const handleCompleteMarine = () => {
    if (!activeMarineCycle || !volume) return
    setError('')
    startTransition(async () => {
      const result = await ops.completeMarineCollection(activeMarineCycle.id, parseFloat(volume))
      if (result.error) setError(result.error)
      else {
        setVolume('')
        loadOperationData()
      }
    })
  }

  // --- Beach Logic ---
  const handleStartBeach = () => {
    setError('')
    startTransition(async () => {
      const result = await ops.startBeachTrip({
        taskId: task.id,
        assetId: selectedAsset || undefined
      })
      if (result.error) setError(result.error)
      else loadOperationData()
    })
  }

  const handleCompleteBeach = () => {
    if (!activeBeachTrip || !volume) return
    setError('')
    startTransition(async () => {
      const result = await ops.completeBeachTrip(activeBeachTrip.id, parseFloat(volume))
      if (result.error) setError(result.error)
      else {
        setVolume('')
        loadOperationData()
      }
    })
  }

  if (task.type !== 'colecta_marina' && task.type !== 'limpieza_playa') return null

  const isMarine = task.type === 'colecta_marina'
  const activeOp = isMarine ? activeMarineCycle : activeBeachTrip
  const opLabel = isMarine ? 'Ciclo de Colecta' : 'Viaje de Transporte'
  const unit = 'm³'

  return (
    <div className="space-y-4">
      {error && <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg">{error}</div>}

      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Operativa: {isMarine ? 'Mar' : 'Playa'}</h2>
        
        {activeOp ? (
          <div className={`${isMarine ? 'bg-teal-50 border-teal-200' : 'bg-cyan-50 border-cyan-200'} border rounded-xl p-4 space-y-3`}>
            <div className="flex justify-between items-center">
              <span className={`text-xs font-bold uppercase tracking-wider ${isMarine ? 'text-teal-700' : 'text-cyan-700'}`}>
                {opLabel} en curso
              </span>
              <span className="text-[10px] text-zinc-500">
                Iniciado: {new Date(activeOp.start_time).toLocaleTimeString()}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Volumen registrado ({unit})</label>
              <input
                type="number"
                step="0.1"
                value={volume}
                onChange={e => setVolume(e.target.value)}
                placeholder="Ej: 2.5"
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <button
              onClick={isMarine ? handleCompleteMarine : handleCompleteBeach}
              disabled={!volume || isPending}
              className={`w-full py-2.5 text-sm font-medium text-white rounded-lg transition-colors ${
                isMarine ? 'bg-teal-600 hover:bg-teal-700' : 'bg-cyan-600 hover:bg-cyan-700'
              } disabled:opacity-50`}
            >
              {isPending ? 'Procesando...' : 'Completar y Registrar'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {assets.length > 0 && (
              <Select
                label={isMarine ? "Embarcación" : "Vehículo"}
                value={selectedAsset}
                onChange={setSelectedAsset}
                options={[
                  { value: '', label: `Seleccionar ${isMarine ? 'embarcación' : 'vehículo'}` },
                  ...assets.map(a => ({ value: a.id, label: a.name }))
                ]}
              />
            )}
            
            <button
              onClick={isMarine ? handleStartMarine : handleStartBeach}
              disabled={isPending}
              className={`w-full py-2.5 text-sm font-medium text-white rounded-lg transition-colors ${
                isMarine ? 'bg-teal-600 hover:bg-teal-700' : 'bg-cyan-600 hover:bg-cyan-700'
              }`}
            >
              {isPending ? 'Iniciando...' : `Iniciar ${isMarine ? 'Colecta' : 'Viaje'}`}
            </button>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-zinc-100 grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Registros</p>
            <p className="text-lg font-bold text-zinc-900">{isMarine ? summary.marineCycles : summary.beachTrips}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Total Volumen</p>
            <p className="text-lg font-bold text-teal-600">
              {(isMarine ? summary.marineVolume : summary.beachVolume).toFixed(1)} <span className="text-xs font-normal text-zinc-500">m³</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
