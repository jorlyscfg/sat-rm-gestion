'use client'

import { useState, useRef, useEffect } from 'react'
import { updateBarrier } from '@/app/actions/assets'
import { useRouter } from 'next/navigation'
import type { Barrier } from '@/types'

const RIVIERA_CENTER: [number, number] = [20.5074, -87.4685]

interface BarrierDeploymentModalProps {
  barrier: Barrier
  workArea: [number, number][]
  onClose: () => void
}

export function BarrierDeploymentModal({ barrier, workArea, onClose }: BarrierDeploymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [coords, setCoords] = useState<[number, number] | null>(
    barrier.latitude && barrier.longitude ? [barrier.latitude, barrier.longitude] : null
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let map: any = null
    let L: any = null
    let dead = false

    const init = async () => {
      L = await import('leaflet')
      if (dead || !containerRef.current) return

      // Fix for Leaflet default icons in Next.js
      delete (L as any).Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const center = coords || (workArea.length > 0 ? workArea[0] : RIVIERA_CENTER)
      map = L.map(containerRef.current).setView(center, 15)
      
      const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri',
        maxZoom: 19
      }).addTo(map)

      const labels = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
        attribution: '&copy; CartoDB',
        maxZoom: 19,
        pane: 'overlayPane'
      }).addTo(map)

      // Draw work area
      if (workArea.length >= 3) {
        L.polygon(workArea, {
          color: '#0d9488',
          weight: 2,
          fillColor: '#0d9488',
          fillOpacity: 0.2
        }).addTo(map)
        map.fitBounds(L.latLngBounds(workArea), { padding: [20, 20] })
      }

      // Barrier icon
      const barrierIcon = L.divIcon({
        className: '',
        html: `<div style="font-size: 24px;">🚧</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })

      if (coords) {
        markerRef.current = L.marker(coords, { icon: barrierIcon, draggable: true }).addTo(map)
        markerRef.current.on('dragend', (e: any) => {
          const p = e.target.getLatLng()
          setCoords([p.lat, p.lng])
        })
      }

      map.on('click', (e: any) => {
        const newCoords: [number, number] = [e.latlng.lat, e.latlng.lng]
        setCoords(newCoords)
        
        if (markerRef.current) {
          markerRef.current.setLatLng(newCoords)
        } else {
          markerRef.current = L.marker(newCoords, { icon: barrierIcon, draggable: true }).addTo(map)
          markerRef.current.on('dragend', (ev: any) => {
            const p = ev.target.getLatLng()
            setCoords([p.lat, p.lng])
          })
        }
      })

      mapRef.current = map
      setReady(true)
    }

    init()

    return () => {
      dead = true
      if (map) map.remove()
    }
  }, [])

  async function handleConfirm() {
    if (!coords) return
    setLoading(true)
    const { error } = await updateBarrier(barrier.id, {
      latitude: coords[0],
      longitude: coords[1],
      status: 'desplegada'
    })
    
    if (error) {
      alert(error)
      setLoading(false)
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Desplegar Barrera</h2>
            <p className="text-xs text-zinc-500 font-medium">{barrier.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="relative flex-1 bg-zinc-100 min-h-[400px]">
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-50/80 z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
                <p className="text-xs font-semibold text-zinc-500">Cargando mapa interactivo...</p>
              </div>
            </div>
          )}
          <div ref={containerRef} className="w-full h-full" />
          
          <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
            <div className="bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg border border-white max-w-xs pointer-events-auto">
              <p className="text-xs font-bold text-zinc-800 mb-1">Instrucciones:</p>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                Haz clic en el mapa dentro de la zona sombreada de color teal para marcar el punto de despliegue. Puedes arrastrar el ícono 🚧 para ajustar la posición.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !coords}
            className="flex-[2] py-3 text-sm font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-teal-600/20"
          >
            {loading ? 'Guardando...' : 'Confirmar Despliegue'}
          </button>
        </div>
      </div>
      
      <style jsx global>{`
        .leaflet-container {
          width: 100%;
          height: 100%;
          font-family: inherit;
        }
        .leaflet-control-attribution {
          font-size: 8px !important;
        }
      `}</style>
    </div>
  )
}
