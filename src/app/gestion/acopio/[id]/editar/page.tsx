'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getCollectionPointById, updateCollectionPoint } from '@/app/actions/collection-points'
import { useSessionProfile } from '@/components/auth/session-provider'
import { BottomNav } from '@/components/layout/bottom-nav'
import { AreaPicker } from '@/components/ui/map-picker'
import { PlaceSearch } from '@/components/ui/place-search'
import type { CollectionPoint } from '@/types'

export default function EditarAcopioPage() {
  const router = useRouter()
  const params = useParams()
  const profile = useSessionProfile()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [point, setPoint] = useState<CollectionPoint | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [workArea, setWorkArea] = useState<[number, number][]>([])
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined)
  const [placeLabel, setPlaceLabel] = useState<string>('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactAddress, setContactAddress] = useState('')
  const [capacityM3, setCapacityM3] = useState('')
  const [error, setError] = useState('')

  const canManage = profile
    ? ['superadmin', 'gerente', 'coordinador'].includes(profile.role)
    : false

  const loadPoint = useCallback(async () => {
    const id = params.id as string
    const result = await getCollectionPointById(id)
    if (result.data) {
      const p = result.data
      setPoint(p)
      setName(p.name)
      setDescription(p.description || '')
      setWorkArea(p.work_area || [])
      setContactEmail(p.contact_email || '')
      setContactPhone(p.contact_phone || '')
      setContactAddress(p.contact_address || '')
      setCapacityM3(p.capacity_m3 != null ? String(p.capacity_m3) : '')
      if (p.latitude && p.longitude) {
        setMapCenter([p.latitude, p.longitude])
      }
    }
    setLoading(false)
  }, [params.id])

  useEffect(() => { loadPoint() }, [loadPoint])

  if (!canManage) {
    return (
      <div className="flex-1 pt-14 pb-20">
        <div className="px-4 py-8 text-center text-zinc-500">Sin permisos para editar</div>
        <BottomNav />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 pt-14 pb-20">
        <div className="px-4 py-8 text-center text-zinc-500">Cargando...</div>
        <BottomNav />
      </div>
    )
  }

  if (!point) {
    return (
      <div className="flex-1 pt-14 pb-20">
        <div className="px-4 py-8 text-center text-zinc-500">Punto de acopio no encontrado</div>
        <BottomNav />
      </div>
    )
  }

  function computeCentroid(
    points: [number, number][]
  ): { latitude: number; longitude: number } | undefined {
    if (points.length === 0) return undefined
    return {
      latitude: points.reduce((s, p) => s + p[0], 0) / points.length,
      longitude: points.reduce((s, p) => s + p[1], 0) / points.length,
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      const centroid = computeCentroid(workArea)

      const result = await updateCollectionPoint(point!.id, {
        name,
        description: description || undefined,
        latitude: centroid?.latitude,
        longitude: centroid?.longitude,
        work_area: workArea.length >= 3 ? workArea : [],
        contact_email: contactEmail || undefined,
        contact_phone: contactPhone || undefined,
        contact_address: contactAddress || undefined,
        capacity_m3: capacityM3 ? parseFloat(capacityM3) : undefined,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      router.push('/gestion/acopio')
    })
  }

  return (
    <div className="flex-1 pt-14 pb-20">
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="p-1.5 -ml-1.5 text-zinc-600 hover:text-zinc-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-zinc-900">Editar Punto de Acopio</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg">{error}</div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">
            Nombre *
          </label>
          <PlaceSearch
            value={name}
            onChange={setName}
            onSelect={(name, lat, lng) => {
              setMapCenter([lat, lng])
              setPlaceLabel(name)
            }}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-700 mb-1">
            Descripción
          </label>
          <textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
            placeholder="Descripción del punto de acopio..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Área del Punto de Acopio</label>
          <p className="text-xs text-zinc-500 mb-2">
            Mínimo 3 puntos para definir el área.
          </p>
          <AreaPicker
            points={workArea}
            onChange={setWorkArea}
            mapCenter={mapCenter}
            placeLabel={placeLabel}
          />
        </div>

        <div>
          <label htmlFor="capacityM3" className="block text-sm font-medium text-zinc-700 mb-1">
            Capacidad (m³)
          </label>
          <input
            id="capacityM3"
            type="number"
            min="0"
            step="0.1"
            value={capacityM3}
            onChange={e => setCapacityM3(e.target.value)}
            className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            placeholder="Ej: 500"
          />
        </div>

        <div className="border-t border-zinc-200 pt-4">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Datos de Contacto</h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
              <input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                placeholder="responsable@acopio.com"
              />
            </div>
            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-zinc-700 mb-1">Teléfono</label>
              <input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                placeholder="+52 984 123 4567"
              />
            </div>
            <div>
              <label htmlFor="contactAddress" className="block text-sm font-medium text-zinc-700 mb-1">Dirección</label>
              <input
                id="contactAddress"
                type="text"
                value={contactAddress}
                onChange={e => setContactAddress(e.target.value)}
                className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                placeholder="Carretera Federal 307 km 45, Q. Roo"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || !name}
          className="w-full py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </form>

      <BottomNav />
    </div>
  )
}
