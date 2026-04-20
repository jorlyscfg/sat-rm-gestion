'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { getClientById, deleteClient, updateClient } from '@/app/actions/clients'
import { useSessionProfile } from '@/components/auth/session-provider'
import { BottomNav } from '@/components/layout/bottom-nav'
import { AreaViewer } from '@/components/ui/map-picker'
import { StatusBadge } from '@/components/ui/status-badge'
import type { Client } from '@/types'

export default function ClienteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const profile = useSessionProfile()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  const canManage = profile ? ['superadmin', 'gerente', 'coordinador'].includes(profile.role) : false

  const loadClient = useCallback(async () => {
    const id = params.id as string
    const result = await getClientById(id)
    if (result.data) setClient(result.data)
    setLoading(false)
  }, [params.id])

  useEffect(() => { loadClient() }, [loadClient])

  async function handleDeactivate() {
    if (!client) return
    await deleteClient(client.id)
    router.push('/gestion/clientes')
  }

  async function handleReactivate() {
    if (!client) return
    await updateClient(client.id, { is_active: true })
    loadClient()
  }

  if (loading) {
    return (
      <div className="flex-1 pt-14 pb-20">
        <div className="px-4 py-8 text-center text-zinc-500">Cargando...</div>
        <BottomNav />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex-1 pt-14 pb-20">
        <div className="px-4 py-8 text-center text-zinc-500">Cliente no encontrado</div>
        <BottomNav />
      </div>
    )
  }

  const mapCenter: [number, number] | undefined =
    client.latitude && client.longitude ? [client.latitude, client.longitude] : undefined

  return (
    <div className="flex-1 pt-14 pb-20">
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push('/gestion/clientes')} className="p-1.5 -ml-1.5 text-zinc-600 hover:text-zinc-900">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-zinc-900 truncate">{client.name}</h1>
          </div>
          <StatusBadge
            label={client.is_active ? 'Activo' : 'Inactivo'}
            colorClass={client.is_active ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-600'}
          />
        </div>

        {client.description && (
          <p className="text-sm text-zinc-600 mb-4">{client.description}</p>
        )}

        {client.work_area && client.work_area.length >= 3 && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-zinc-900 mb-2">Área de Trabajo</h2>
            <AreaViewer points={client.work_area} center={mapCenter} />
            <p className="text-xs text-zinc-400 mt-1">{client.work_area.length} vértices definidos</p>
          </div>
        )}

        <div className="space-y-3 mb-4">
          <h2 className="text-sm font-semibold text-zinc-900">Datos de Contacto</h2>

          {client.contact_email && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.616a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
              <a href={`mailto:${client.contact_email}`} className="text-teal-700 hover:underline">{client.contact_email}</a>
            </div>
          )}

          {client.contact_phone && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 2.852c-.125-.501-.575-.852-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
              <a href={`tel:${client.contact_phone}`} className="text-teal-700 hover:underline">{client.contact_phone}</a>
            </div>
          )}

          {client.contact_address && (
            <div className="flex items-start gap-2 text-sm">
              <svg className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
              <span>{client.contact_address}</span>
            </div>
          )}

          {!client.contact_email && !client.contact_phone && !client.contact_address && (
            <p className="text-sm text-zinc-400">Sin datos de contacto registrados</p>
          )}
        </div>

        {canManage && (
          <div className="flex items-center gap-2 pt-3 border-t border-zinc-200">
            <Link
              href={`/gestion/clientes/${client.id}/editar`}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Editar
            </Link>
            {client.is_active ? (
              <button
                onClick={handleDeactivate}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                Desactivar
              </button>
            ) : (
              <button
                onClick={handleReactivate}
                className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                Reactivar
              </button>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}