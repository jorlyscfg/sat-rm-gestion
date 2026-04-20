'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createTask } from '@/app/actions/tasks'
import { getAssignableProfiles } from '@/app/actions/profile'
import { getClients } from '@/app/actions/clients'
import { getAvailableAssets } from '@/app/actions/assets'
import { useSessionProfile } from '@/components/auth/session-provider'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Select } from '@/components/ui/select'
import { TASK_TYPE_LABELS, TASK_PRIORITY_LABELS, ROLE_LABELS, ZONE_LABELS, ZONE_COLORS, ASSET_TYPE_LABELS } from '@/lib/utils'
import type { TaskType, TaskPriority, Profile, Client, Asset } from '@/types'

const taskTypes: TaskType[] = ['barrera_despliegue', 'colecta_marina', 'limpieza_playa', 'acopio_recepcion', 'disposicion', 'inspeccion']
const taskPriorities: TaskPriority[] = ['baja', 'media', 'alta', 'urgente']

export default function NuevaTareaPage() {
  const router = useRouter()
  const profile = useSessionProfile()
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<TaskType>('colecta_marina')
  const [priority, setPriority] = useState<TaskPriority>('media')
  const [location, setLocation] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [clientId, setClientId] = useState('')
  const [zone, setZone] = useState<string>('mar')
  const [assetIds, setAssetIds] = useState<string[]>([])
  
  const [operators, setOperators] = useState<Profile[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    getAssignableProfiles().then(res => res.data && setOperators(res.data))
    getClients({ isActive: true }).then(res => res.data && setClients(res.data))
    getAvailableAssets().then(res => res.data && setAvailableAssets(res.data))
  }, [])

  // Auto-set zone when client changes
  useEffect(() => {
    if (clientId) {
      const client = clients.find(c => c.id === clientId)
      if (client?.zone) {
        setZone(client.zone)
      }
    }
  }, [clientId, clients])

  const toggleAsset = (id: string) => {
    setAssetIds(prev => prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!profile) { setError('No autenticado'); return }
    if (!clientId) { setError('Debe seleccionar un cliente'); return }

    startTransition(async () => {
      const result = await createTask({
        title,
        description: description || undefined,
        type,
        priority,
        location: location || undefined,
        assigned_to: assignedTo || undefined,
        client_id: clientId,
        zone,
        asset_ids: assetIds,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      router.push('/gestion/tareas')
      router.refresh()
    })
  }

  return (
    <div className="flex-1 pt-14 pb-20 bg-zinc-50">
      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Nueva Tarea Operativa</h1>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-800 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm" />
            {error}
          </div>
        )}

        {/* Sección 1: Información General */}
        <section className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
          <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Información General</h2>
          
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1.5 ml-1">Título de la Tarea</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all placeholder:text-zinc-300"
              placeholder="Ej: Recolección Sector Norte"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo"
              value={type}
              onChange={v => setType(v as TaskType)}
              options={taskTypes.map(t => ({ value: t, label: TASK_TYPE_LABELS[t] }))}
              required
            />
            <Select
              label="Prioridad"
              value={priority}
              onChange={v => setPriority(v as TaskPriority)}
              options={taskPriorities.map(p => ({ value: p, label: TASK_PRIORITY_LABELS[p] }))}
              required
            />
          </div>
        </section>

        {/* Sección 2: Ubicación y Cliente */}
        <section className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
          <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Ubicación y Área</h2>
          
          <Select
            label="Cliente / Hotel"
            value={clientId}
            onChange={setClientId}
            options={[
              { value: '', label: 'Seleccionar cliente' },
              ...clients.map(c => ({ value: c.id, label: c.name })),
            ]}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-2 ml-1">Zona de Trabajo</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(ZONE_LABELS).map(([z, label]) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZone(z)}
                  className={`
                    py-3 px-2 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center gap-1
                    ${zone === z 
                      ? `${ZONE_COLORS[z]} ring-2 ring-offset-1` 
                      : 'bg-white border-zinc-200 text-zinc-500 grayscale opacity-60'
                    }
                  `}
                >
                  <span className="text-lg">
                    {z === 'mar' ? '🌊' : z === 'playa' ? '🏖️' : '🚜'}
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Sección 3: Recursos (Asignación) */}
        <section className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-5">
          <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Recursos Humanos y Activos</h2>

          <Select
            label="Operador Responsable"
            value={assignedTo}
            onChange={setAssignedTo}
            options={[
              { value: '', label: 'Sin asignar' },
              ...operators.map(op => ({ value: op.id, label: `${op.name} (${ROLE_LABELS[op.role] || op.role})` })),
            ]}
          />

          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-3 ml-1">Seleccionar Activos Disponibles</label>
            {availableAssets.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-zinc-100 rounded-2xl">
                <p className="text-xs text-zinc-400">No hay activos disponibles hoy</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {availableAssets.map(asset => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => toggleAsset(asset.id)}
                    className={`
                      w-full flex items-center justify-between p-3 rounded-xl border transition-all
                      ${assetIds.includes(asset.id)
                        ? 'bg-teal-50 border-teal-200 text-teal-800 ring-2 ring-teal-500/10'
                        : 'bg-zinc-50 border-zinc-100 text-zinc-600 hover:bg-white hover:border-zinc-200'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${assetIds.includes(asset.id) ? 'bg-teal-100' : 'bg-white shadow-sm'}`}>
                        {asset.type === 'embarcacion' ? '🚤' : asset.type === 'camion' ? '🚛' : '🛻'}
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-bold">{asset.name}</p>
                        <p className="text-[9px] opacity-70 uppercase tracking-wider">{ASSET_TYPE_LABELS[asset.type]}</p>
                      </div>
                    </div>
                    {assetIds.includes(asset.id) && (
                      <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center text-white text-[10px]">
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending || !clientId}
            className="w-full py-4 text-sm font-bold text-white bg-zinc-900 rounded-2xl hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-30 disabled:pointer-events-none shadow-lg shadow-zinc-200"
          >
            {isPending ? 'Procesando...' : 'Confirmar y Crear Tarea'}
          </button>
        </div>
      </form>

      <BottomNav />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }
      `}</style>
    </div>
  )
}