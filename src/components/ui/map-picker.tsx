'use client'

import { useEffect, useRef, useState } from 'react'

const RIVIERA_CENTER: [number, number] = [20.5074, -87.4685]
const DEFAULT_ZOOM = 11

const LEAFLET_ICONS = {
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
}

let leafletModule: any = null

async function getLeaflet() {
  if (leafletModule) return leafletModule
  const L = await import('leaflet')
  delete (L as any).Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions(LEAFLET_ICONS)
  leafletModule = L
  return L
}

const STREET_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const STREET_ATTR = '&copy; OpenStreetMap'
const SATELLITE_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const SATELLITE_ATTR = '&copy; Esri'
const LABELS_TILES = 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'
const LABELS_ATTR = '&copy; CartoDB'

function initMap(L: any, container: HTMLDivElement, center: [number, number]) {
  const map = L.map(container, {
    center,
    zoom: DEFAULT_ZOOM,
    doubleClickZoom: false,
  })

  const street = L.tileLayer(STREET_TILES, { attribution: STREET_ATTR, maxZoom: 19 })
  const satellite = L.tileLayer(SATELLITE_TILES, { attribution: SATELLITE_ATTR, maxZoom: 19 })
  const labels = L.tileLayer(LABELS_TILES, { attribution: LABELS_ATTR, maxZoom: 19, pane: 'overlayPane' })

  street.addTo(map)

  L.control.layers(
    { 'Mapa': street, 'Satélite': satellite, 'Satélite + Etiquetas': L.layerGroup([satellite, labels]) },
    {},
    { position: 'topright', collapsed: true }
  ).addTo(map)

  setTimeout(() => map.invalidateSize(), 200)
  return map
}

interface LocationPickerProps {
  latitude: number | undefined
  longitude: number | undefined
  onChange: (lat: number, lng: number) => void
}

interface AreaPickerProps {
  points: [number, number][]
  onChange: (points: [number, number][]) => void
  mapCenter?: [number, number]
  placeLabel?: string
}

export function AreaViewer({ points, center }: { points: [number, number][]; center?: [number, number] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const mapRef = useRef<any>(null)
  const LRef = useRef<any>(null)
  const layersRef = useRef<any[]>([])
  const polyRef = useRef<any>(null)
  const pointsRef = useRef(points)
  pointsRef.current = points

  function drawAll(L: any, map: any, pts: [number, number][]) {
    layersRef.current.forEach(l => l.remove())
    layersRef.current = []
    if (polyRef.current) { polyRef.current.remove(); polyRef.current = null }
    if (!L || !map) return
    pts.forEach(p => {
      const m = L.marker(p, { draggable: false, interactive: false }).addTo(map)
      layersRef.current.push(m)
    })
    if (pts.length >= 3) {
      polyRef.current = L.polygon(pts, {
        color: '#0d9488', weight: 2, fillColor: '#0d9488', fillOpacity: 0.15,
      }).addTo(map)
    }
  }

  useEffect(() => {
    let map: any = null
    let dead = false

    getLeaflet().then(L => {
      if (dead || !containerRef.current) return
      if ((containerRef.current as any)._mapInit) return
      ;(containerRef.current as any)._mapInit = true

      LRef.current = L
      const mapCenter = center || (pts => pts.length > 0 ? pts[0] : RIVIERA_CENTER)(pointsRef.current)
      map = initMap(L, containerRef.current, mapCenter)
      mapRef.current = map

      if (pointsRef.current.length >= 3) {
        map.fitBounds(L.latLngBounds(pointsRef.current), { padding: [40, 40] })
      }

      drawAll(L, map, pointsRef.current)
      setReady(true)
    })

    return () => {
      dead = true
      if (map) map.remove()
      if (containerRef.current) delete (containerRef.current as any)._mapInit
      mapRef.current = null
      LRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!ready || !LRef.current || !mapRef.current) return
    drawAll(LRef.current, mapRef.current, points)
    if (points.length >= 3) {
      mapRef.current.fitBounds(LRef.current.latLngBounds(points), { padding: [40, 40] })
    }
  }, [ready, points])

  return (
    <div className="w-full h-64 rounded-lg border border-zinc-300 overflow-hidden">
      {!ready && <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-sm text-zinc-400">Cargando mapa...</div>}
      <div ref={containerRef} className="w-full h-full leaflet-container-visible" />
    </div>
  )
}

export { RIVIERA_CENTER, DEFAULT_ZOOM }

export function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    let map: any = null
    let dead = false

    getLeaflet().then(L => {
      if (dead || !containerRef.current) return
      if ((containerRef.current as any)._mapInit) return
      ;(containerRef.current as any)._mapInit = true

      const center: [number, number] =
        latitude != null && longitude != null ? [latitude, longitude] : RIVIERA_CENTER

      map = initMap(L, containerRef.current, center)
      const marker = L.marker(center, { draggable: true }).addTo(map)

      marker.on('dragend', () => {
        const p = marker.getLatLng()
        onChangeRef.current(p.lat, p.lng)
      })
      map.on('click', (e: any) => {
        marker.setLatLng([e.latlng.lat, e.latlng.lng])
        onChangeRef.current(e.latlng.lat, e.latlng.lng)
      })

      mapRef.current = map
      markerRef.current = marker
      setReady(true)
    })

    return () => {
      dead = true
      if (map) map.remove()
      if (containerRef.current) delete (containerRef.current as any)._mapInit
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || latitude == null || longitude == null) return
    markerRef.current.setLatLng([latitude, longitude])
    mapRef.current.setView([latitude, longitude], DEFAULT_ZOOM)
  }, [latitude, longitude])

  return (
    <div className="w-full h-64 rounded-lg border border-zinc-300 overflow-hidden">
      {!ready && <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-sm text-zinc-400">Cargando mapa...</div>}
      <div ref={containerRef} className="w-full h-full leaflet-container-visible" />
    </div>
  )
}

export function AreaPicker({ points, onChange, mapCenter, placeLabel }: AreaPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const mapRef = useRef<any>(null)
  const LRef = useRef<any>(null)
  const layersRef = useRef<any[]>([])
  const polyRef = useRef<any>(null)
  const placeMarkerRef = useRef<any>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const pointsRef = useRef(points)
  pointsRef.current = points

  function clearLayers() {
    layersRef.current.forEach(l => l.remove())
    layersRef.current = []
    if (polyRef.current) { polyRef.current.remove(); polyRef.current = null }
  }

  function drawAll(L: any, map: any, pts: [number, number][]) {
    clearLayers()
    if (!L || !map) return
    pts.forEach((p, i) => {
      const m = L.marker(p, { draggable: true }).addTo(map)
      m.on('dragend', () => {
        const pos = m.getLatLng()
        const updated = [...pointsRef.current]
        updated[i] = [pos.lat, pos.lng]
        onChangeRef.current(updated)
      })
      layersRef.current.push(m)
    })
    if (pts.length >= 3) {
      polyRef.current = L.polygon(pts, {
        color: '#0d9488', weight: 2, fillColor: '#0d9488', fillOpacity: 0.15,
      }).addTo(map)
    }
  }

  useEffect(() => {
    let map: any = null
    let dead = false

    getLeaflet().then(L => {
      if (dead || !containerRef.current) return
      if ((containerRef.current as any)._mapInit) return
      ;(containerRef.current as any)._mapInit = true

      LRef.current = L
      const initialCenter = mapCenter || (pointsRef.current.length > 0 ? pointsRef.current[0] : RIVIERA_CENTER)
      console.log('[AreaPicker] Initializing map at:', initialCenter, 'with points:', pointsRef.current.length)
      map = initMap(L, containerRef.current, initialCenter)

      map.on('click', (e: any) => {
        const pt: [number, number] = [e.latlng.lat, e.latlng.lng]
        const updated = [...pointsRef.current, pt]
        drawAll(L, map, updated)
        onChangeRef.current(updated)
      })

      mapRef.current = map
      drawAll(L, map, pointsRef.current)
      
      if (pointsRef.current.length >= 3) {
        console.log('[AreaPicker] Initial fitBounds')
        map.fitBounds(L.latLngBounds(pointsRef.current), { padding: [40, 40] })
        setDidFit(true)
      } else if (mapCenter) {
        setDidFit(true)
      }
      
      setReady(true)
    })

    return () => {
      dead = true
      if (map) map.remove()
      if (containerRef.current) delete (containerRef.current as any)._mapInit
      mapRef.current = null
      LRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!ready || !LRef.current || !mapRef.current) return
    drawAll(LRef.current, mapRef.current, points)
  }, [ready, points])

  const [didFit, setDidFit] = useState(false)

  useEffect(() => {
    if (!ready || !LRef.current || !mapRef.current || didFit) return
    if (points.length >= 3) {
      mapRef.current.fitBounds(LRef.current.latLngBounds(points), { padding: [40, 40] })
      setDidFit(true)
    } else if (mapCenter) {
      mapRef.current.setView(mapCenter, DEFAULT_ZOOM)
      setDidFit(true)
    }
  }, [ready, points, mapCenter, didFit])

  useEffect(() => {
    if (!mapRef.current || !mapCenter || !ready) return
    mapRef.current.setView(mapCenter, DEFAULT_ZOOM)
  }, [mapCenter, ready])

  useEffect(() => {
    const L = LRef.current
    const map = mapRef.current
    if (!L || !map) return

    if (placeMarkerRef.current) {
      placeMarkerRef.current.remove()
      placeMarkerRef.current = null
    }

    if (mapCenter && placeLabel) {
      const redIcon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:25px;height:41px;">
          <svg viewBox="0 0 24 36" width="25" height="41" style="filter:drop-shadow(1px 1px 2px rgba(0,0,0,0.4))">
            <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#dc2626"/>
            <circle cx="12" cy="12" r="5" fill="white"/>
          </svg>
        </div>`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [0, -41],
      })

      const marker = L.marker(mapCenter, { icon: redIcon }).addTo(map)
      marker.bindPopup(`<div style="font-size:13px;font-weight:600;color:#1e293b;padding:2px 0;">${placeLabel}</div>`, {
        closeButton: false,
        autoPan: true,
      }).openPopup()

      placeMarkerRef.current = marker
    }
  }, [mapCenter, placeLabel])

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {points.length > 0 && (
          <>
            <button type="button" onClick={() => onChange(points.slice(0, -1))} className="p-1.5 text-zinc-500 hover:text-zinc-700 transition-colors" title="Deshacer último punto">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
            </button>
            <button type="button" onClick={() => onChange([])} className="p-1.5 text-red-400 hover:text-red-600 transition-colors" title="Limpiar todo">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </>
        )}
        <span className="text-xs text-zinc-500">
          {points.length === 0
            ? 'Haz clic en el mapa para marcar los vértices del área'
            : points.length < 3
              ? `${points.length} punto${points.length > 1 ? 's' : ''} — Faltan ${3 - points.length} más para definir el área`
              : `${points.length} puntos — Área definida ✓`
          }
        </span>
      </div>
      <div className="w-full h-72 rounded-lg border border-zinc-300 overflow-hidden">
        {!ready && <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-sm text-zinc-400">Cargando mapa...</div>}
        <div ref={containerRef} className="w-full h-full leaflet-container-visible" />
      </div>
      <p className="text-xs text-zinc-400 mt-1">Arrastra los marcadores para ajustar la forma. Usa el control de capas (esquina superior derecha) para cambiar entre mapa y satélite.</p>
    </div>
  )
}