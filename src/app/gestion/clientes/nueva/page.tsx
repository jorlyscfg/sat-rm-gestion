'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/actions/clients'
import { useSessionProfile } from '@/components/auth/session-provider'
import { BottomNav } from '@/components/layout/bottom-nav'
import { AreaPicker } from '@/components/ui/map-picker'
import { PlaceSearch } from '@/components/ui/place-search'

export default function NuevaClientePage() {
  const router = useRouter()
  const profile = useSessionProfile()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [workArea, setWorkArea] = useState<[number, number][]>([])
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined)
  const [placeLabel, setPlaceLabel] = useState<string>('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactAddress, setContactAddress] = useState('')
  const [error, setError] = useState('')

  const canManage = profile ? ['superadmin', 'gerente', 'coordinador'].includes(profile.role) : false

  if (!canManage) {
    return (
      <div className="flex-1 pt-14 pb-20">
        <div className="px-4 py-8 text-center text-zinc-500">Sin permisos para crear clientes</div>
        <BottomNav />
      </div>
    )
  }

  function computeCentroid(points: [number, number][]): { latitude: number; longitude: number } | undefined {
    if (points.length === 0) return undefined
    const sumLat = points.reduce((s, p) => s + p[0], 0)
    const sumLng = points.reduce((s, p) => s + p[1], 0)
    return { latitude: sumLat / points.length, longitude: sumLng / points.length }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      const centroid = computeCentroid(workArea)

      const result = await createClient({
        name,
        description: description || undefined,
        latitude: centroid?.latitude,
        longitude: centroid?.longitude,
        workArea: workArea.length >= 3 ? workArea : undefined,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        contactAddress: contactAddress || undefined,
      })

      if (result.error) {
        console.error('Error creating client:', result.error)
        setError(result.error)
        return
      }

      router.push('/gestion/clientes')
    })
  }

  return (
    <div className="flex-1 pt-14 pb-20">
      <form onSubmit={handleSubmit} className="px-4 py-3 space-y-4">
        {error && <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg">{error}</div>}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">Nombre *</label>
          <PlaceSearch
            value={name}
            onChange={setName}
            onSelect={(name, lat, lng) => { setMapCenter([lat, lng]); setPlaceLabel(name) }}
          />
          <p className="text-xs text-zinc-400 mt-1">Busca el nombre del hotel, playa o zona. Selecciona una ubicación para centrar el mapa.</p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-700 mb-1">Descripción</label>
          <textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
            placeholder="Descripción del cliente y su zona de cobertura"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Área de Trabajo *
          </label>
          <p className="text-xs text-zinc-500 mb-2">
            Marca en el mapa la zona costera y marina que corresponde a este cliente. Mínimo 3 puntos para definir el área. Esta área se usará como referencia para las alertas de sargazo.
          </p>
          <AreaPicker points={workArea} onChange={setWorkArea} mapCenter={mapCenter} placeLabel={placeLabel} />
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
                className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                placeholder="contacto@hotel.com"
              />
            </div>

            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-zinc-700 mb-1">Teléfono / Móvil</label>
              <input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
                className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                placeholder="Av. Tulum, Playa del Carmen, Q. Roo"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || !name}
          className="w-full py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Creando...' : 'Crear Cliente'}
        </button>
      </form>

      <BottomNav />
    </div>
  )
}