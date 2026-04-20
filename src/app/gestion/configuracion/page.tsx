'use client'

import React, { useState, useEffect } from 'react'
import { listProfiles, createManagedAccount, getUserProfile, updateProfile, deleteProfile } from '@/app/actions/profile'
import { getMyOrganization, deleteOrganizationAndAllData } from '@/app/actions/organizations'
import { getAssets, assignOperatorToAsset, unassignOperatorFromAsset } from '@/app/actions/assets'
import type { Profile, UserRole, Organization, Asset } from '@/types'
import { ASSET_TYPE_LABELS } from '@/lib/utils'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { createInsForgeClient } from '@/lib/insforge'
import { useRouter } from 'next/navigation'

export default function ConfiguracionPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | undefined>(undefined)
  const [activeTab, setActiveTab] = useState<'users' | 'system'>('users')
  const [searchQuery, setSearchQuery] = useState('')
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
    const [pResult, oResult, uResult, aResult] = await Promise.all([
      listProfiles(),
      getMyOrganization(),
      getUserProfile(),
      getAssets(),
    ])
    
    if (pResult.data) setProfiles(pResult.data)
    if (oResult.data) setOrganization(oResult.data)
    if (uResult) setCurrentUser(uResult)
    if (aResult.data) setAssets(aResult.data)
    
    setLoading(false)
  }

  async function fetchProfiles() {
    const [pResult, aResult] = await Promise.all([listProfiles(), getAssets()])
    if (pResult.data) setProfiles(pResult.data)
    if (aResult.data) setAssets(aResult.data)
  }

  const filteredProfiles = profiles.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 pt-14 pb-20 max-w-lg mx-auto w-full">
      <div className="p-4 space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 leading-tight">Configuración</h1>
            {organization ? (
              <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest mt-0.5">{organization.name}</p>
            ) : (
              <p className="text-xs text-zinc-500">Usuarios y sistema</p>
            )}
          </div>
          {['superadmin', 'gerente', 'gerencia'].includes(currentUser?.role || '') && (
          <button
            onClick={() => { setEditingProfile(undefined); setShowModal(true); }}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Nuevo
          </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border whitespace-nowrap ${
              activeTab === 'users' ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
            }`}
          >
            Usuarios ({profiles.length})
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border whitespace-nowrap ${
              activeTab === 'system' ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
            }`}
          >
            Configuración Sistema
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              <input
                type="text"
                placeholder="Buscar por nombre o rol..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              {loading ? (
                <div className="py-12 bg-white rounded-2xl border border-zinc-100 flex flex-col items-center justify-center">
                  <svg className="w-8 h-8 animate-spin text-teal-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <p className="text-zinc-400 text-xs mt-3 font-medium">Sincronizando perfiles...</p>
                </div>
              ) : filteredProfiles.length === 0 ? (
                <div className="py-12 bg-white rounded-2xl border border-zinc-100 text-center">
                  <p className="text-zinc-400 text-sm">No se encontraron usuarios</p>
                </div>
              ) : (
                filteredProfiles.map((p) => (
                  <div key={p.id} className="bg-white p-3 rounded-xl border border-zinc-200 flex items-center justify-between group hover:border-teal-300 transition-colors shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-bold shrink-0 border border-teal-100">
                        {p.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-zinc-900 text-sm truncate">{p.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] uppercase font-bold tracking-wider border ${getRoleStyle(p.role)}`}>
                            {p.role.replace('_', ' ')}
                          </span>
                          {p.phone && (
                            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                               <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                               {p.phone}
                            </span>
                          )}
                        </div>
                        {/* Assigned asset for operators */}
                        {p.role === 'operador' && (() => {
                          const assignedAsset = assets.find(a => a.assigned_operator_id === p.id)
                          return assignedAsset ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100 font-medium mt-1">
                              {assignedAsset.type === 'embarcacion' ? '🚤' : assignedAsset.type === 'camion' ? '🚛' : '🛻'} {assignedAsset.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 font-medium mt-1">
                              Sin activo asignado
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingProfile(p); setShowModal(true); }} className="text-[10px] font-bold text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100 transition-all active:scale-95">
                        EDITAR
                      </button>
                      {p.id !== currentUser?.id && ['superadmin', 'gerente', 'gerencia'].includes(currentUser?.role || '') && (
                        <button 
                          onClick={() => {
                            setConfirmConfig({
                              isOpen: true,
                              title: 'Dar de Baja Usuario',
                              message: `¿Estás seguro que deseas dar de baja a ${p.name}? Perderá el acceso inmediatamente.`,
                              isDestructive: true,
                              onConfirm: async () => {
                                setConfirmConfig(prev => ({ ...prev, isOpen: false }))
                                const { error } = await deleteProfile(p.id)
                                if (!error) {
                                  fetchProfiles()
                                } else {
                                  console.error('Error deleting user:', error)
                                }
                              }
                            })
                          }}
                          className="text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition-all active:scale-95"
                        >
                          ELIMINAR
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'system' && (
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
                      Al eliminar la organización se destruirán permanentemente todas las tareas, reportes, activos, clientes y perfiles de usuario. Esta acción no se puede deshacer y perderás tu acceso inmediatamente.
                    </p>
                    <button
                      onClick={() => {
                        setConfirmConfig({
                          isOpen: true,
                          title: 'Eliminar Organización Completamente',
                          message: `¿Estás ABSOLUTAMENTE seguro de eliminar ${organization.name}? Se borrarán TODOS los datos, recolecciones, operadores e historial de inmediato.`,
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
                              console.error('Error al eliminar organización:', error)
                              setLoading(false)
                              setError(error)
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
        )}
      </div>

      <BottomNav />

      {showModal && (
        <UserFormModal 
          profile={editingProfile}
          assets={assets}
          currentUserRole={currentUser?.role || ''}
          onClose={() => { setShowModal(false); setEditingProfile(undefined); }} 
          onSuccess={() => {
            setShowModal(false)
            setEditingProfile(undefined)
            fetchProfiles()
          }} 
        />
      )}

      <ConfirmModal
        {...confirmConfig}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}

function getRoleStyle(role: string) {
  switch (role) {
    case 'superadmin': return 'bg-purple-50 text-purple-700 border-purple-100'
    case 'gerente':
    case 'gerencia': return 'bg-amber-50 text-amber-700 border-amber-100'
    case 'coordinador': return 'bg-blue-50 text-blue-700 border-blue-100'
    default: return 'bg-zinc-50 text-zinc-600 border-zinc-100'
  }
}

function UserFormModal({ profile, assets, currentUserRole, onClose, onSuccess }: { 
  profile?: Profile
  assets: Asset[]
  currentUserRole: string
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: '',
    phone: profile?.phone || '',
    password: '',
    role: profile?.role || 'operador' as UserRole,
    organizationId: profile?.organization_id || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  
  // Asset assignment state (only for operator profiles being edited)
  const currentAssignedAsset = profile ? assets.find(a => a.assigned_operator_id === profile.id) : undefined
  const [selectedAssetId, setSelectedAssetId] = useState<string>(currentAssignedAsset?.id || '')

  useEffect(() => {
    async function loadData() {
      const uResult = await getUserProfile()
      if (uResult) {
        setCurrentUser(uResult)
        if (!profile && uResult.role !== 'superadmin' && uResult.organization_id) {
          setFormData(prev => ({ ...prev, organizationId: uResult.organization_id! }))
        }
        
        if (uResult.role === 'superadmin') {
          const { getOrganizations } = await import('@/app/actions/organizations')
          const { data } = await getOrganizations()
          if (data) setOrganizations(data)
        }
      }
    }
    loadData()
  }, [])

  // Assets available for selection: unassigned ones + the current one already assigned to this operator
  const availableAssets = assets.filter(a => 
    !a.assigned_operator_id || a.assigned_operator_id === profile?.id
  )

  const isEditingOperator = !!profile && (formData.role === 'operador' || profile.role === 'operador')
  const canManageAssets = ['superadmin', 'gerente', 'gerencia'].includes(currentUserRole)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    let result;
    
    if (profile) {
      result = await updateProfile(profile.id, {
        name: formData.name,
        phone: formData.phone,
        role: formData.role
      })
    } else {
      result = await createManagedAccount(formData)
    }

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // Handle asset assignment if editing an operator
    if (profile && isEditingOperator && canManageAssets) {
      if (selectedAssetId && selectedAssetId !== currentAssignedAsset?.id) {
        // Assign the new asset
        await assignOperatorToAsset(selectedAssetId, profile.id)
        // Unassign from old one if there was one
        if (currentAssignedAsset) {
          await unassignOperatorFromAsset(currentAssignedAsset.id)
        }
      } else if (!selectedAssetId && currentAssignedAsset) {
        // Remove assignment
        await unassignOperatorFromAsset(currentAssignedAsset.id)
      }
    }

    setTimeout(() => {
      onSuccess()
    }, 300)
  }


  return (
    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-50 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-2 duration-300">
        <div className="px-6 py-5 border-b border-zinc-200 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">{profile ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">{profile ? 'Actualizar Datos' : 'Acceso Personal de Campo'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
             <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[85vh] overflow-y-auto no-scrollbar">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 flex items-center gap-2 font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" /></svg>
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Nombre Completo</label>
            <div className="relative group">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-teal-600 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              <input
                required
                type="text"
                className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-medium"
                placeholder="Juan Pérez..."
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Email</label>
              <div className="relative group">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-teal-600 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                <input
                  required={!profile}
                  disabled={!!profile}
                  type="email"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-medium disabled:opacity-50 disabled:bg-zinc-100"
                  placeholder={profile ? 'No modificable' : 'email@servidor.com'}
                  value={profile ? '---' : formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Móvil</label>
              <div className="relative group">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-teal-600 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                <input
                  type="tel"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-medium"
                  placeholder="Ej. +52..."
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          {!profile && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Contraseña</label>
              <div className="relative group">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-teal-600 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-12 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-medium"
                  placeholder="Min. 8 caracteres"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.413 16.19 7.743 19 12 19c.993 0 1.954-.138 2.87-.396M6.228 6.228A10.45 10.45 0 0112 5c4.257 0 8.587 2.81 10.066 7-.346.974-.835 1.886-1.443 2.71M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 5 12 5c4.638 0 8.573 2.51 10.963 6.322a1.012 1.012 0 010 .639C20.577 16.49 16.64 19 12 19c-4.638 0-8.573-2.51-10.964-6.322z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {!profile && currentUser?.role === 'superadmin' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Organización</label>
              <select
                required
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-medium appearance-none"
                value={formData.organizationId}
                onChange={e => setFormData({ ...formData, organizationId: e.target.value })}
              >
                <option value="">Seleccionar organización...</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Rol Operativo</label>
            <div className="grid grid-cols-2 gap-2">
               {[
                 { id: 'operador', label: 'Operador' },
                 { id: 'coordinador', label: 'Coordinador' },
                 { id: 'gerente', label: 'Gerente' }
               ].filter(r => currentUser?.role === 'superadmin' || r.id !== 'gerente' || profile?.role === 'gerente').map(role => {
                 const isDisabled = (profile?.role === 'gerente' || profile?.role === 'gerencia') && role.id !== profile.role
                 return (
                 <button
                   key={role.id}
                   type="button"
                   disabled={isDisabled}
                   onClick={() => setFormData({ ...formData, role: role.id as UserRole })}
                   className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                     formData.role === role.id ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-500/20' : 'bg-white border-zinc-200 text-zinc-500 hover:border-teal-200'
                   } ${isDisabled ? 'opacity-50 cursor-not-allowed hover:border-zinc-200 bg-zinc-50' : ''}`}
                 >
                   {role.label}
                 </button>
               )})}
            </div>
          </div>

          {/* Asset assignment — only shown when editing an operator and current user can manage assets */}
          {isEditingOperator && canManageAssets && (
            <div className="space-y-1.5 border-t border-zinc-100 pt-5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Activo Asignado</label>
              <p className="text-[10px] text-zinc-400 ml-1 mb-2">El activo asignado quedará disponible para tareas</p>
              <select
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-medium appearance-none"
                value={selectedAssetId}
                onChange={e => setSelectedAssetId(e.target.value)}
              >
                <option value="">Sin activo asignado</option>
                {availableAssets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.type === 'embarcacion' ? '🚤' : asset.type === 'camion' ? '🚛' : '🛻'} {asset.name} — {ASSET_TYPE_LABELS[asset.type]}
                    {asset.assigned_operator_id === profile?.id ? ' (actual)' : ''}
                  </option>
                ))}
              </select>
              {availableAssets.length === 0 && (
                <p className="text-[10px] text-orange-500 ml-1 mt-1">No hay activos sin asignar disponibles.</p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2 pb-2">
            <button
              disabled={loading}
              type="submit"
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-teal-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-sm"
            >
              {loading && <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              {loading ? (profile ? 'GUARDANDO...' : 'REGISTRANDO...') : (profile ? 'GUARDAR CAMBIOS' : 'REGISTRAR USUARIO')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

