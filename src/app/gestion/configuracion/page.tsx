'use client'

import React, { useState, useEffect } from 'react'
import { getUserProfile } from '@/app/actions/profile'
import { getMyOrganization, deleteOrganizationAndAllData } from '@/app/actions/organizations'
import type { Profile, Organization } from '@/types'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { createInsForgeClient } from '@/lib/insforge'
import { useRouter } from 'next/navigation'

export default function ConfiguracionPage() {
  const router = useRouter()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    isDestructive?: boolean
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  useEffect(() => {
    init()
  }, [])

  async function init() {
    setLoading(true)
    const [oResult, uResult] = await Promise.all([
      getMyOrganization(),
      getUserProfile(),
    ])
    
    if (oResult.data) setOrganization(oResult.data)
    if (uResult) setCurrentUser(uResult)
    
    setLoading(false)
  }

  return (
    <div className="flex-1 pt-14 pb-20 max-w-lg mx-auto w-full">
      <div className="p-4 space-y-6">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <h1 className="text-xl font-bold text-zinc-900 leading-tight">Configuración</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Parámetros del sistema y organización</p>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
            <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Detalles de Organización</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-zinc-50">
                <span className="text-sm text-zinc-500">Nombre de Organización</span>
                <span className="text-sm font-bold text-zinc-900">{organization?.name || 'Cargando...'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-50">
                <span className="text-sm text-zinc-500">Slug / Identificador</span>
                <span className="text-sm font-medium text-zinc-400 uppercase tracking-tight">{organization?.slug || '---'}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-zinc-500">Estado</span>
                <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">Activo</span>
              </div>
            </div>
          </div>

          {currentUser?.role === 'superadmin' && (
            <div className="bg-teal-50/50 p-6 rounded-2xl border border-teal-100 text-center">
              <p className="text-teal-800 text-xs font-medium mb-1">Modo Administrador</p>
              <p className="text-teal-600/70 text-[10px]">Tienes acceso a configuraciones globales del sistema.</p>
            </div>
          )}

          {(currentUser?.role === 'gerente' || currentUser?.role === 'gerencia') && organization && (
            <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100 mt-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-red-100 rounded-full text-red-600 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-800 mb-1">Zona de Peligro</h3>
                  <p className="text-xs text-red-600/80 mb-4 font-medium leading-relaxed">
                    Al eliminar la organización se destruirán permanentemente todas las tareas, reportes, activos, clientes y perfiles de usuario. Esta acción no se puede deshacer.
                  </p>
                  <button
                    onClick={() => {
                      setConfirmConfig({
                        isOpen: true,
                        title: 'Eliminar Organización Completamente',
                        message: `¿Estás ABSOLUTAMENTE seguro de eliminar ${organization.name}? Se borrarán TODOS los datos de inmediato.`,
                        isDestructive: true,
                        onConfirm: async () => {
                          setLoading(true)
                          setConfirmConfig(prev => ({ ...prev, isOpen: false }))
                          const { error } = await deleteOrganizationAndAllData(organization.id)
                          if (!error) {
                            const insforge = createInsForgeClient()
                            await insforge.auth.signOut()
                            router.push('/auth/sign-in')
                          } else {
                            setError(error)
                            setLoading(false)
                          }
                        }
                      })
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-red-500/20 active:scale-95"
                  >
                    ELIMINAR MI ORGANIZACIÓN
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav />

      <ConfirmModal
        {...confirmConfig}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
