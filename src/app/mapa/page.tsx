'use client'

import { useEffect, useState } from 'react'
import { getClients } from '@/app/actions/clients'
import { getCollectionPoints } from '@/app/actions/collection-points'
import { BottomNav } from '@/components/layout/bottom-nav'
import type { Client, CollectionPoint } from '@/types'
import dynamic from 'next/dynamic'

const RivieraMap = dynamic(
  () => import('@/components/ui/riviera-map').then(m => ({ default: m.RivieraMap })),
  { ssr: false }
)

export default function MapaPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [collectionPoints, setCollectionPoints] = useState<CollectionPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      getClients({ isActive: true }),
      getCollectionPoints({ isActive: true }),
    ]).then(([clientsResult, acopioResult]) => {
      if (clientsResult.error) {
        setError(clientsResult.error)
      } else {
        setClients(clientsResult.data ?? [])
      }
      if (acopioResult.data) {
        setCollectionPoints(acopioResult.data)
      }
      setLoading(false)
    })
  }, [])

  const totalOnMap =
    clients.filter(c => (c.work_area && c.work_area.length >= 3) || c.latitude != null).length +
    collectionPoints.filter(p => (p.work_area && p.work_area.length >= 3) || p.latitude != null).length

  return (
    <div className="fixed inset-0 flex flex-col" style={{ paddingTop: 56, paddingBottom: 64 }}>
      {/* Header */}
      <div
        className="absolute left-0 right-0 top-0 z-50 flex items-center gap-2 px-4 bg-white border-b border-zinc-200"
        style={{ height: 56 }}
      >
        <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.227-.114.443-.278.602-.476.16-.198.25-.436.25-.684V4.462c0-.318-.126-.624-.353-.849a1.215 1.215 0 00-.851-.348H15.36a1.22 1.22 0 00-.865.36L12.015 6.6l-2.483-2.484A1.22 1.22 0 008.666 3.75H4.626c-.319 0-.625.126-.85.351a1.19 1.19 0 00-.35.849v11.25c0 .248.09.486.25.684.159.198.375.362.602.476l4.875 2.437c.312.156.667.234 1.029.234.362 0 .717-.078 1.029-.234l4.875-2.437z" />
        </svg>
        <h1 className="text-base font-semibold text-zinc-900">Riviera Maya</h1>

        {loading && (
          <div className="ml-auto w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
        )}
        {!loading && !error && (
          <span className="ml-auto text-xs text-zinc-400">
            {clients.length} clientes · {collectionPoints.length} acopios · {totalOnMap} en mapa
          </span>
        )}
      </div>

      {/* Map area */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-6">
              <svg className="w-10 h-10 mx-auto text-red-300 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-sm text-zinc-500">Error al cargar datos del mapa</p>
              <p className="text-xs text-red-500 mt-1">{error}</p>
            </div>
          </div>
        ) : (
          <RivieraMap clients={clients} collectionPoints={collectionPoints} />
        )}
      </div>

      <BottomNav />
    </div>
  )
}