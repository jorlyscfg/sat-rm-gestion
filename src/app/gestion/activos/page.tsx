'use client'

import { useEffect, useState, useCallback, useTransition } from 'react'
import { getAssets, getBarriers, createAsset, createBarrier, updateAsset, updateBarrier, deleteAsset, deleteBarrier } from '@/app/actions/assets'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { useSessionProfile } from '@/components/auth/session-provider'
import { BottomNav } from '@/components/layout/bottom-nav'
import { StatusBadge } from '@/components/ui/status-badge'
import { Select } from '@/components/ui/select'
import { CompactSelect } from '@/components/ui/select'
import { ASSET_TYPE_LABELS, ASSET_STATUS_LABELS, ASSET_STATUS_COLORS, BARRIER_TYPE_LABELS, BARRIER_STATUS_LABELS, BARRIER_STATUS_COLORS } from '@/lib/utils'
import { ImageUploadMulti } from '@/components/ui/image-upload-multi'
import { ImagePreviewModal } from '@/components/ui/image-preview-modal'
import type { Asset, Barrier, AssetType, AssetStatus, BarrierType, BarrierStatus } from '@/types'

type Tab = 'embarcaciones' | 'vehiculos' | 'barreras'

const assetTypes: AssetType[] = ['embarcacion', 'atv', 'pickup', 'camion']
const assetStatuses: AssetStatus[] = ['disponible', 'en_uso', 'mantenimiento', 'fuera_de_servicio']
const barrierTypes: BarrierType[] = ['flotante', 'fija', 'mixta']
const barrierStatuses: BarrierStatus[] = ['almacenada', 'desplegada', 'mantenimiento', 'dañada']

export default function ActivosPage() {
  const profile = useSessionProfile()
  const [tab, setTab] = useState<Tab>('embarcaciones')
  const [assets, setAssets] = useState<Asset[]>([])
  const [barriers, setBarriers] = useState<Barrier[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('')

  const [showNewAsset, setShowNewAsset] = useState(false)
  const [showNewBarrier, setShowNewBarrier] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [editingBarrier, setEditingBarrier] = useState<Barrier | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<{ id: string, type: 'asset' | 'barrier', name: string } | null>(null)

  const isAdmin = profile ? ['superadmin', 'gerente'].includes(profile.role) : false

  const loadData = useCallback(async () => {
    const [assetsResult, barriersResult] = await Promise.all([
      getAssets(filterStatus ? { status: filterStatus } : undefined),
      getBarriers(),
    ])
    if (assetsResult.data) setAssets(assetsResult.data)
    if (barriersResult.data) setBarriers(barriersResult.data)
    setLoading(false)
  }, [filterStatus])

  useEffect(() => { loadData() }, [loadData])

  function reload() {
    startTransition(async () => { await loadData() })
  }

  const filteredAssets = tab === 'embarcaciones'
    ? assets.filter(a => a.type === 'embarcacion')
    : assets.filter(a => ['atv', 'pickup', 'camion'].includes(a.type))

  return (
    <div className="flex-1 pt-14 pb-20">
      <div className="px-4 pt-2 flex gap-2 border-b border-zinc-200">
        {(['embarcaciones', 'vehiculos', 'barreras'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setFilterStatus('') }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'text-teal-600 border-teal-600' : 'text-zinc-500 border-transparent hover:text-zinc-700'
            }`}
          >
            {t === 'embarcaciones' ? 'Embarcaciones' : t === 'vehiculos' ? 'Vehículos' : 'Barreras'}
          </button>
        ))}
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <CompactSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: '', label: 'Todos' },
              ...(tab === 'barreras'
                ? barrierStatuses.map(s => ({ value: s, label: BARRIER_STATUS_LABELS[s] }))
                : assetStatuses.map(s => ({ value: s, label: ASSET_STATUS_LABELS[s] }))),
            ]}
          />
          {isAdmin && (
            <button
              onClick={() => tab === 'barreras' ? setShowNewBarrier(true) : setShowNewAsset(true)}
              className="ml-auto px-3 py-1.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Nuevo
            </button>
          )}
        </div>

        {error && <div className="p-3 mb-3 text-sm text-red-700 bg-red-50 rounded-lg">{error}</div>}

        {loading ? (
          <div className="text-center py-8 text-zinc-500">Cargando...</div>
        ) : tab === 'barreras' ? (
          <div className="space-y-2">
            {barriers.map(b => (
              <div key={b.id} className="bg-white rounded-xl border border-zinc-200 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">{b.name}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{BARRIER_TYPE_LABELS[b.type] || b.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge label={BARRIER_STATUS_LABELS[b.status]} colorClass={BARRIER_STATUS_COLORS[b.status]} />
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingBarrier(b)}
                          className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                        </button>
                        <button
                          onClick={() => setToDelete({ id: b.id, type: 'barrier', name: b.name })}
                          className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {b.length_m && <p className="text-xs text-zinc-500 mt-1">Longitud: {b.length_m}m</p>}
                {b.description && <p className="text-xs text-zinc-400 mt-1">{b.description}</p>}

                {b.image_urls && b.image_urls.length > 0 && (
                  <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                    {b.image_urls.map((url, i) => (
                      <div 
                        key={i} 
                        className="flex-none w-14 h-14 rounded-lg overflow-hidden border border-zinc-200 cursor-zoom-in active:scale-95 transition-transform"
                        onClick={() => setPreviewUrl(url)}
                      >
                        <img src={url} alt={`Barrier ${i}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {barriers.length === 0 && <div className="text-center py-8 text-zinc-400 text-sm">Sin barreras registradas</div>}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAssets.map(a => (
              <div key={a.id} className="bg-white rounded-xl border border-zinc-200 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">{a.name}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{ASSET_TYPE_LABELS[a.type]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge label={ASSET_STATUS_LABELS[a.status]} colorClass={ASSET_STATUS_COLORS[a.status]} />
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingAsset(a)}
                          className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                        </button>
                        <button
                          onClick={() => setToDelete({ id: a.id, type: 'asset', name: a.name })}
                          className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {a.capacity && <p className="text-xs text-zinc-500 mt-1">Capacidad: {a.capacity} m³</p>}
                {a.description && <p className="text-xs text-zinc-400 mt-1">{a.description}</p>}

                {/* Assigned operators */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {a.asset_operators && a.asset_operators.length > 0 ? (
                    a.asset_operators.map((ao, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100 font-medium">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                        {ao.profile?.name || 'Operador'}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 font-medium">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                      Sin operadores asignados
                    </span>
                  )}
                </div>
                
                {a.image_urls && a.image_urls.length > 0 && (
                  <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                    {a.image_urls.map((url, i) => (
                      <div 
                        key={i} 
                        className="flex-none w-14 h-14 rounded-lg overflow-hidden border border-zinc-200 cursor-zoom-in active:scale-95 transition-transform"
                        onClick={() => setPreviewUrl(url)}
                      >
                        <img src={url} alt={`Asset ${i}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {filteredAssets.length === 0 && <div className="text-center py-8 text-zinc-400 text-sm">Sin activos registrados</div>}
          </div>
        )}
      </div>

      {showNewAsset && (
        <NewAssetModal
          defaultType={tab === 'embarcaciones' ? 'embarcacion' : 'atv'}
          onClose={() => { setShowNewAsset(false); setError('') }}
          onPreview={setPreviewUrl}
          onSubmit={async (input) => {
            setError('')
            const result = await createAsset(input)
            if (result.error) { setError(result.error); return }
            setShowNewAsset(false)
            reload()
          }}
          isPending={isPending}
          startTransition={startTransition}
        />
      )}

      {showNewBarrier && (
        <NewBarrierModal
          onClose={() => { setShowNewBarrier(false); setError('') }}
          onPreview={setPreviewUrl}
          onSubmit={async (input) => {
            setError('')
            const result = await createBarrier(input)
            if (result.error) { setError(result.error); return }
            setShowNewBarrier(false)
            reload()
          }}
          isPending={isPending}
          startTransition={startTransition}
        />
      )}

      {editingAsset && (
        <EditAssetModal
          asset={editingAsset}
          onClose={() => setEditingAsset(null)}
          onPreview={setPreviewUrl}
          onSubmit={async (id, updates) => {
            setError('')
            const result = await updateAsset(id, updates)
            if (result.error) { setError(result.error); return }
            setEditingAsset(null)
            reload()
          }}
          isPending={isPending}
          startTransition={startTransition}
        />
      )}

      {editingBarrier && (
        <EditBarrierModal
          barrier={editingBarrier}
          onClose={() => setEditingBarrier(null)}
          onPreview={setPreviewUrl}
          onSubmit={async (id, updates) => {
            setError('')
            const result = await updateBarrier(id, updates)
            if (result.error) { setError(result.error); return }
            setEditingBarrier(null)
            reload()
          }}
          isPending={isPending}
          startTransition={startTransition}
        />
      )}

      <BottomNav />
      {previewUrl && <ImagePreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}
      
      <ConfirmModal
        isOpen={!!toDelete}
        title={`Eliminar ${toDelete?.type === 'asset' ? 'Activo' : 'Barrera'}`}
        message={`¿Estás seguro de que deseas eliminar permanentemente "${toDelete?.name}"? Esta acción borrará el registro y todas sus imágenes asociadas.`}
        confirmText="Eliminar"
        isDestructive
        onConfirm={async () => {
          if (!toDelete) return
          setError('')
          const result = toDelete.type === 'asset' 
            ? await deleteAsset(toDelete.id)
            : await deleteBarrier(toDelete.id)
          
          if (result.error) {
            setError(result.error)
          } else {
            setToDelete(null)
            reload()
          }
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

function NewAssetModal({ defaultType, onClose, onPreview, onSubmit, isPending, startTransition }: {
  defaultType: string
  onClose: () => void
  onPreview: (url: string) => void
  onSubmit: (input: { name: string; type: string; status?: string; capacity?: number; description?: string; image_urls?: string[] }) => void
  isPending: boolean
  startTransition: React.TransitionStartFunction
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState(defaultType)
  const [capacity, setCapacity] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])

  return (
    <Modal onClose={onClose}>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Nuevo Activo</h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            placeholder="Nombre del activo"
          />
        </div>

        <Select
          label="Tipo"
          value={type}
          onChange={setType}
          options={assetTypes.map(t => ({ value: t, label: ASSET_TYPE_LABELS[t] }))}
          required
        />

        {type === 'embarcacion' && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Capacidad (m³)</label>
            <input
              type="number"
              step="0.1"
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
              className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              placeholder="Ej: 2.5"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Descripción</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
            placeholder="Notas opcionales"
          />
        </div>

        <ImageUploadMulti
          urls={imageUrls}
          onUrlsChange={setImageUrls}
          onPreview={onPreview}
          limit={5}
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (!name) return
              startTransition(() => {
                onSubmit({
                  name,
                  type,
                  status: 'disponible',
                  capacity: capacity ? parseFloat(capacity) : undefined,
                  description: description || undefined,
                  image_urls: imageUrls,
                })
              })
            }}
            disabled={isPending || !name}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Creando...' : 'Crear'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function NewBarrierModal({ onClose, onPreview, onSubmit, isPending, startTransition }: {
  onClose: () => void
  onPreview: (url: string) => void
  onSubmit: (input: { name: string; type: string; status?: string; length_m?: number; description?: string; image_urls?: string[] }) => void
  isPending: boolean
  startTransition: React.TransitionStartFunction
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<BarrierType>('flotante')
  const [lengthM, setLengthM] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])

  return (
    <Modal onClose={onClose}>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Nueva Barrera</h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            placeholder="Nombre de la barrera"
          />
        </div>

        <Select
          label="Tipo"
          value={type}
          onChange={v => setType(v as BarrierType)}
          options={barrierTypes.map(t => ({ value: t, label: BARRIER_TYPE_LABELS[t] }))}
          required
        />

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Longitud (m)</label>
          <input
            type="number"
            step="0.1"
            value={lengthM}
            onChange={e => setLengthM(e.target.value)}
            className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            placeholder="Ej: 100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Descripción</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
            placeholder="Notas opcionales"
          />
        </div>

        <ImageUploadMulti
          urls={imageUrls}
          onUrlsChange={setImageUrls}
          onPreview={onPreview}
          limit={5}
        />

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => {
              if (!name) return
              startTransition(() => {
                onSubmit({
                  name,
                  type,
                  status: 'almacenada',
                  length_m: lengthM ? parseFloat(lengthM) : undefined,
                  description: description || undefined,
                  image_urls: imageUrls,
                })
              })
            }}
            disabled={isPending || !name}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Creando...' : 'Crear'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function EditAssetModal({ asset, onClose, onPreview, onSubmit, isPending, startTransition }: {
  asset: Asset
  onClose: () => void
  onPreview: (url: string) => void
  onSubmit: (id: string, updates: Partial<Asset>) => void
  isPending: boolean
  startTransition: React.TransitionStartFunction
}) {
  const [name, setName] = useState(asset.name)
  const [status, setStatus] = useState<string>(asset.status)
  const [capacity, setCapacity] = useState(asset.capacity?.toString() || '')
  const [description, setDescription] = useState(asset.description || '')
  const [imageUrls, setImageUrls] = useState<string[]>(asset.image_urls || [])

  return (
    <Modal onClose={onClose}>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Editar Activo</h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <Select
          label="Estado"
          value={status}
          onChange={setStatus}
          options={assetStatuses.map(s => ({ value: s, label: ASSET_STATUS_LABELS[s] }))}
        />

        {asset.type === 'embarcacion' && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Capacidad (m³)</label>
            <input
              type="number"
              step="0.1"
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
              className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Descripción</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
          />
        </div>

        <ImageUploadMulti
          urls={imageUrls}
          onUrlsChange={setImageUrls}
          onPreview={onPreview}
          limit={5}
        />

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => {
              startTransition(() => {
                const updates: Partial<Asset> = {}
                if (name !== asset.name) updates.name = name
                if (status !== asset.status) updates.status = status as AssetStatus
                if (capacity !== (asset.capacity?.toString() || '')) updates.capacity = capacity ? parseFloat(capacity) : undefined
                if (description !== (asset.description || '')) updates.description = description || undefined
                if (JSON.stringify(imageUrls) !== JSON.stringify(asset.image_urls || [])) updates.image_urls = imageUrls
                onSubmit(asset.id, updates)
              })
            }}
            disabled={isPending}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function EditBarrierModal({ barrier, onClose, onPreview, onSubmit, isPending, startTransition }: {
  barrier: Barrier
  onClose: () => void
  onPreview: (url: string) => void
  onSubmit: (id: string, updates: Partial<Barrier>) => void
  isPending: boolean
  startTransition: React.TransitionStartFunction
}) {
  const [name, setName] = useState(barrier.name)
  const [status, setStatus] = useState<string>(barrier.status)
  const [lengthM, setLengthM] = useState(barrier.length_m?.toString() || '')
  const [description, setDescription] = useState(barrier.description || '')
  const [imageUrls, setImageUrls] = useState<string[]>(barrier.image_urls || [])

  return (
    <Modal onClose={onClose}>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Editar Barrera</h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <Select
          label="Estado"
          value={status}
          onChange={setStatus}
          options={barrierStatuses.map(s => ({ value: s, label: BARRIER_STATUS_LABELS[s] }))}
        />

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Longitud (m)</label>
          <input
            type="number"
            step="0.1"
            value={lengthM}
            onChange={e => setLengthM(e.target.value)}
            className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Descripción</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
          />
        </div>

        <ImageUploadMulti
          urls={imageUrls}
          onUrlsChange={setImageUrls}
          onPreview={onPreview}
          limit={5}
        />

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => {
              startTransition(() => {
                const updates: Partial<Barrier> = {}
                if (name !== barrier.name) updates.name = name
                if (status !== barrier.status) updates.status = status as BarrierStatus
                if (lengthM !== (barrier.length_m?.toString() || '')) updates.length_m = lengthM ? parseFloat(lengthM) : undefined
                if (description !== (barrier.description || '')) updates.description = description || undefined
                if (JSON.stringify(imageUrls) !== JSON.stringify(barrier.image_urls || [])) updates.image_urls = imageUrls
                onSubmit(barrier.id, updates)
              })
            }}
            disabled={isPending}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}