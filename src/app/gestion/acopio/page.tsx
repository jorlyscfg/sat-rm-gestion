'use client'

import { useEffect, useState, useCallback } from 'react'
import { getCollectionPoints, deleteCollectionPoint } from '@/app/actions/collection-points'
import { useSessionProfile } from '@/components/auth/session-provider'
import { BottomNav } from '@/components/layout/bottom-nav'
import { StatusBadge } from '@/components/ui/status-badge'
import Link from 'next/link'
import type { CollectionPoint } from '@/types'

export default function AcopioPage() {
  const profile = useSessionProfile()
  const [points, setPoints] = useState<CollectionPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)

  const canManage = profile
    ? ['superadmin', 'gerente'].includes(profile.role)
    : false

  const loadData = useCallback(async () => {
    setLoading(true)
    const result = await getCollectionPoints({ isActive: !showInactive })
    if (result.data) setPoints(result.data)
    setLoading(false)
  }, [showInactive])

  useEffect(() => { loadData() }, [loadData])

  async function handleDeactivate(id: string) {
    await deleteCollectionPoint(id)
    loadData()
  }

  return (
    <div className="flex-1 pt-14 pb-20">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-zinc-900">Puntos de Acopio</h1>
          {canManage && (
            <Link
              href="/gestion/acopio/nuevo"
              className="px-3 py-1.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Nuevo
            </Link>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setShowInactive(false)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              !showInactive
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setShowInactive(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              showInactive
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            Inactivos
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-zinc-500">Cargando...</div>
        ) : points.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-12 h-12 mx-auto text-zinc-300 mb-3"
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <p className="text-sm text-zinc-400">Sin puntos de acopio registrados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {points.map(point => (
              <div key={point.id} className="bg-white rounded-xl border border-zinc-200 p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    {/* Icon + name */}
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-orange-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </span>
                      <h3 className="text-sm font-semibold text-zinc-900 truncate">{point.name}</h3>
                    </div>
                    {point.description && (
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2 ml-8">{point.description}</p>
                    )}
                  </div>
                  <StatusBadge
                    label={point.is_active ? 'Activo' : 'Inactivo'}
                    colorClass={
                      point.is_active ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-600'
                    }
                  />
                </div>

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 ml-8 text-xs text-zinc-500">
                  {point.work_area && point.work_area.length >= 3 && (
                    <span className="inline-flex items-center gap-1 text-orange-600">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.227-.114.443-.278.602-.476.16-.198.25-.436.25-.684V4.462c0-.318-.126-.624-.353-.849a1.215 1.215 0 00-.851-.348H15.36a1.22 1.22 0 00-.865.36L12.015 6.6l-2.483-2.484A1.22 1.22 0 008.666 3.75H4.626c-.319 0-.625.126-.85.351a1.19 1.19 0 00-.35.849v11.25c0 .248.09.486.25.684.159.198.375.362.602.476l4.875 2.437c.312.156.667.234 1.029.234.362 0 .717-.078 1.029-.234l4.875-2.437z" />
                      </svg>
                      Área definida ({point.work_area.length} vértices)
                    </span>
                  )}
                  {point.capacity_m3 != null && (
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                      {point.capacity_m3} m³
                    </span>
                  )}
                  {point.contact_email && <span>{point.contact_email}</span>}
                  {point.contact_phone && <span>{point.contact_phone}</span>}
                </div>

                {canManage && point.is_active && (
                  <div className="flex items-center gap-2 mt-3 ml-8">
                    <Link
                      href={`/gestion/acopio/${point.id}/editar`}
                      className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-50 rounded hover:bg-orange-100 transition-colors"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDeactivate(point.id)}
                      className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                    >
                      Desactivar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
