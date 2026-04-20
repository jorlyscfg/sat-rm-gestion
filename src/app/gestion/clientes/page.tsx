'use client'

import { useEffect, useState, useCallback } from 'react'
import { getClients, deleteClient } from '@/app/actions/clients'
import { useSessionProfile } from '@/components/auth/session-provider'
import { BottomNav } from '@/components/layout/bottom-nav'
import { StatusBadge } from '@/components/ui/status-badge'
import Link from 'next/link'
import type { Client } from '@/types'

export default function ClientesPage() {
  const profile = useSessionProfile()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)

  const canManage = profile ? ['superadmin', 'gerente'].includes(profile.role) : false

  const loadData = useCallback(async () => {
    const result = await getClients({ isActive: !showInactive })
    if (result.data) setClients(result.data)
    setLoading(false)
  }, [showInactive])

  useEffect(() => { loadData() }, [loadData])

  async function handleDeactivate(id: string) {
    await deleteClient(id)
    loadData()
  }

  return (
    <div className="flex-1 pt-14 pb-20">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-zinc-900">Clientes</h1>
          {canManage && (
            <Link
              href="/gestion/clientes/nueva"
              className="px-3 py-1.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Nuevo
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setShowInactive(false)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              !showInactive ? 'bg-teal-600 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setShowInactive(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              showInactive ? 'bg-teal-600 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            Inactivos
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-zinc-500">Cargando...</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 text-sm">Sin clientes registrados</div>
        ) : (
          <div className="space-y-2">
            {clients.map(client => (
              <div key={client.id} className="bg-white rounded-xl border border-zinc-200 p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-zinc-900 truncate">{client.name}</h3>
                    {client.description && (
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{client.description}</p>
                    )}
                  </div>
                  <StatusBadge
                    label={client.is_active ? 'Activo' : 'Inactivo'}
                    colorClass={client.is_active ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-600'}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-zinc-500">
                  {client.work_area && client.work_area.length >= 3 && (
                    <span className="inline-flex items-center gap-1 text-teal-600">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.227-.114.443-.278.602-.476.16-.198.25-.436.25-.684V4.462c0-.318-.126-.624-.353-.849a1.215 1.215 0 00-.851-.348H15.36a1.22 1.22 0 00-.865.36L12.015 6.6l-2.483-2.484A1.22 1.22 0 008.666 3.75H4.626c-.319 0-.625.126-.85.351a1.19 1.19 0 00-.35.849v11.25c0 .248.09.486.25.684.159.198.375.362.602.476l4.875 2.437c.312.156.667.234 1.029.234.362 0 .717-.078 1.029-.234l4.875-2.437z" /></svg>
                      Área definida ({client.work_area.length} vértices)
                    </span>
                  )}
                  {client.contact_email && <span>{client.contact_email}</span>}
                  {client.contact_phone && <span>{client.contact_phone}</span>}
                </div>

                {canManage && client.is_active && (
                  <div className="flex items-center gap-2 mt-2">
                    <Link
                      href={`/gestion/clientes/${client.id}/editar`}
                      className="px-2 py-1 text-xs font-medium text-teal-700 bg-teal-50 rounded hover:bg-teal-100 transition-colors"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDeactivate(client.id)}
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