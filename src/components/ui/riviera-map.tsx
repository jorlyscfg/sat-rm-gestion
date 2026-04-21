'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Client, CollectionPoint, Task, Asset } from '@/types'

// Riviera Maya bounding box: tierra (W) → mar (E), Cancún (N) → Tulum (S)
const RIVIERA_BOUNDS: [[number, number], [number, number]] = [
  [21.25, -87.35], // NW — tierra norte
  [20.05, -86.75], // SE — mar sur
]
const RIVIERA_CENTER: [number, number] = [20.65, -87.05]
const DEFAULT_ZOOM = 10

const SATELLITE_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const SATELLITE_ATTR = '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
const STREET_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const STREET_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
const LABELS_TILES = 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'
const LABELS_ATTR = '&copy; <a href="https://carto.com/">CartoDB</a>'

const LEAFLET_ICONS = {
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
}

// Color palette for collection points — one per acopio
const ACOPIO_COLORS = [
  '#f97316', // orange
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#ef4444', // red
  '#a78bfa', // purple light
  '#f59e0b', // amber
]

// OSRM public router (OpenStreetMap routing, no API key needed)
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving'

let leafletModule: any = null
async function getLeaflet() {
  if (leafletModule) return leafletModule
  const L = await import('leaflet')
  delete (L as any).Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions(LEAFLET_ICONS)
  leafletModule = L
  return L
}

function buildPinIcon(L: any, color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:28px;height:44px;">
      <svg viewBox="0 0 24 36" width="28" height="44" style="filter:drop-shadow(1px 2px 3px rgba(0,0,0,0.45))">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}"/>
        <circle cx="12" cy="12" r="5" fill="white"/>
      </svg>
    </div>`,
    iconSize: [28, 44],
    iconAnchor: [14, 44],
    popupAnchor: [0, -46],
  })
}

function buildAcopioIcon(L: any, color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:32px;height:32px;">
      <svg viewBox="0 0 32 32" width="32" height="32" style="filter:drop-shadow(1px 2px 3px rgba(0,0,0,0.45))">
        <rect x="2" y="2" width="28" height="28" rx="6" fill="${color}"/>
        <path d="M16 8L7 13v11h18V13L16 8z" fill="white" opacity="0.9"/>
        <rect x="13" y="17" width="6" height="7" rx="1" fill="${color}"/>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  })
}

function buildTaskIcon(L: any, color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:24px;height:24px;">
      <svg viewBox="0 0 24 24" width="24" height="24" style="filter:drop-shadow(1px 1px 2px rgba(0,0,0,0.5))">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        <path d="M9 12l2 2 4-4" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

function buildAssetIcon(L: any, type: string) {
  const emoji = type === 'embarcacion' ? '🚤' : type === 'camion' ? '🚛' : '🛻'
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:white;border-radius:50%;border:2px solid #0d9488;box-shadow:0 2px 4px rgba(0,0,0,0.2);font-size:16px;">
      ${emoji}
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function getCentroid(points: [number, number][]): [number, number] {
  const lat = points.reduce((s, p) => s + p[0], 0) / points.length
  const lng = points.reduce((s, p) => s + p[1], 0) / points.length
  return [lat, lng]
}

function getEntityCoord(
  entity: { work_area?: [number, number][]; latitude?: number | null; longitude?: number | null }
): [number, number] | null {
  if (entity.work_area && entity.work_area.length >= 3) return getCentroid(entity.work_area)
  if (entity.latitude != null && entity.longitude != null) return [entity.latitude, entity.longitude]
  return null
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${Math.round(meters)} m`
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60)
  if (mins >= 60) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h}h ${m}min` : `${h}h`
  }
  return `${mins} min`
}

async function fetchOsrmRoute(
  from: [number, number], // [lat, lng]
  to: [number, number]
): Promise<{ coords: [number, number][]; distance: number; duration: number } | null> {
  // OSRM uses [lng, lat] order
  const url = `${OSRM_BASE}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const json = await res.json()
    if (json.code !== 'Ok' || !json.routes?.length) return null
    const route = json.routes[0]
    // geojson coords are [lng, lat] → convert to [lat, lng] for Leaflet
    const coords: [number, number][] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    )
    return { coords, distance: route.distance, duration: route.duration }
  } catch {
    return null
  }
}

function buildRouteFallback(from: [number, number], to: [number, number]): [number, number][] {
  // Straight line with midpoint bow for visual clarity
  const midLat = (from[0] + to[0]) / 2
  const midLng = (from[1] + to[1]) / 2
  return [from, [midLat, midLng], to]
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371
  const dLat = ((b[0] - a[0]) * Math.PI) / 180
  const dLng = ((b[1] - a[1]) * Math.PI) / 180
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const c = sinLat * sinLat + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * sinLng * sinLng
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c))
}

function buildClientPopup(client: Client): string {
  const lines: string[] = []
  lines.push(`<div style="font-family:system-ui,sans-serif;min-width:180px;max-width:240px;">`)
  lines.push(`<div style="font-size:11px;font-weight:600;color:#0d9488;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px;">Cliente</div>`)
  lines.push(`<div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:4px;">${escHtml(client.name)}</div>`)
  if (client.description) {
    lines.push(`<div style="font-size:12px;color:#475569;margin-bottom;line-height:1.4;">${escHtml(client.description)}</div>`)
  }
  if (client.contact_email) lines.push(`<div style="font-size:11px;color:#64748b;">✉ ${escHtml(client.contact_email)}</div>`)
  if (client.contact_phone) lines.push(`<div style="font-size:11px;color:#64748b;">📞 ${escHtml(client.contact_phone)}</div>`)
  lines.push(`</div>`)
  return lines.join('')
}

function buildAcopioPopup(point: CollectionPoint, color: string): string {
  const lines: string[] = []
  lines.push(`<div style="font-family:system-ui,sans-serif;min-width:180px;max-width:240px;">`)
  lines.push(`<div style="font-size:11px;font-weight:600;color:${color};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px;">Punto de Acopio</div>`)
  lines.push(`<div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:4px;">${escHtml(point.name)}</div>`)
  if (point.description) lines.push(`<div style="font-size:12px;color:#475569;margin-bottom:4px;">${escHtml(point.description)}</div>`)
  if (point.capacity_m3 != null) lines.push(`<div style="font-size:11px;color:${color};">📦 Capacidad: ${point.capacity_m3} m³</div>`)
  if (point.contact_email) lines.push(`<div style="font-size:11px;color:#64748b;">✉ ${escHtml(point.contact_email)}</div>`)
  if (point.contact_phone) lines.push(`<div style="font-size:11px;color:#64748b;">📞 ${escHtml(point.contact_phone)}</div>`)
  lines.push(`</div>`)
  return lines.join('')
}

function buildTaskPopup(task: Task): string {
  const lines: string[] = []
  lines.push(`<div style="font-family:system-ui,sans-serif;min-width:180px;max-width:240px;">`)
  lines.push(`<div style="font-size:11px;font-weight:600;color:#f59e0b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px;">Tarea: ${task.status}</div>`)
  lines.push(`<div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:4px;">${escHtml(task.title)}</div>`)
  if (task.description) {
    lines.push(`<div style="font-size:12px;color:#475569;margin-bottom:4px;line-height:1.4;">${escHtml(task.description)}</div>`)
  }
  if (task.client) {
    lines.push(`<div style="font-size:11px;color:#64748b;margin-top:4px;">📍 Cliente: ${escHtml(task.client.name)}</div>`)
  }
  if (task.assigned_profile) {
    lines.push(`<div style="font-size:11px;color:#0d9488;margin-top:2px;">👤 Asignado: ${escHtml(task.assigned_profile.name)}</div>`)
  }
  lines.push(`</div>`)
  return lines.join('')
}

function buildAssetPopup(asset: Asset): string {
  const lines: string[] = []
  lines.push(`<div style="font-family:system-ui,sans-serif;min-width:180px;max-width:240px;">`)
  lines.push(`<div style="font-size:11px;font-weight:600;color:#0d9488;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px;">Activo: ${asset.status}</div>`)
  lines.push(`<div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:4px;">${escHtml(asset.name)}</div>`)
  lines.push(`<div style="font-size:11px;color:#64748b;margin-bottom:4px;">Tipo: ${escHtml(asset.type)}</div>`)
  if (asset.assigned_operator) {
    lines.push(`<div style="font-size:11px;color:#475569;">👤 Operador: ${escHtml(asset.assigned_operator.name)}</div>`)
  }
  lines.push(`</div>`)
  return lines.join('')
}

function buildRoutePopup(
  acopio: CollectionPoint,
  client: Client,
  color: string,
  distance: number,
  duration: number,
  isFallback: boolean
): string {
  return `<div style="font-family:system-ui,sans-serif;min-width:200px;max-width:260px;">
    <div style="font-size:11px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">🛣 Ruta por carretera</div>
    <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
      <div style="flex:1;">
        <div style="font-size:10px;color:#94a3b8;margin-bottom:2px;">ACOPIO</div>
        <div style="font-size:13px;font-weight:600;color:#1e293b;">${escHtml(acopio.name)}</div>
      </div>
      <div style="font-size:18px;color:#94a3b8;padding-top:14px;">→</div>
      <div style="flex:1;">
        <div style="font-size:10px;color:#94a3b8;margin-bottom:2px;">CLIENTE</div>
        <div style="font-size:13px;font-weight:600;color:#1e293b;">${escHtml(client.name)}</div>
      </div>
    </div>
    <div style="display:flex;gap:16px;padding:12px;background:#f8fafc;border-radius:10px;border:1px solid #f1f5f9;">
      <div style="text-align:center;flex:1;">
        <div style="font-size:16px;font-weight:700;color:#0f172a;">${formatDistance(distance)}</div>
        <div style="font-size:10px;color:#94a3b8;font-weight:500;">distancia</div>
      </div>
      <div style="width:1px;background:#e2e8f0;"></div>
      <div style="text-align:center;flex:1;">
        <div style="font-size:16px;font-weight:700;color:#0f172a;">${formatDuration(duration)}</div>
        <div style="font-size:10px;color:#94a3b8;font-weight:500;">en vehículo</div>
      </div>
    </div>
    ${isFallback ? `<div style="font-size:10px;color:#f59e0b;margin-top:8px;font-weight:500;">⚠ Línea estimada (sin conexión a red vial)</div>` : ''}
  </div>`
}

function hasCoords(item: { work_area: [number, number][]; latitude?: number; longitude?: number }) {
  return (item.work_area && item.work_area.length >= 3) || (item.latitude != null && item.longitude != null)
}

interface RivieraMapProps {
  clients: Client[]
  collectionPoints: CollectionPoint[]
  tasks: Task[]
  assets: Asset[]
}

export function RivieraMap({ clients, collectionPoints, tasks, assets }: RivieraMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const clientLayersRef = useRef<any[]>([])
  const acopioLayersRef = useRef<any[]>([])
  const taskLayersRef = useRef<any[]>([])
  const assetLayersRef = useRef<any[]>([])
  const routeLayersRef = useRef<any[]>([])
  const [ready, setReady] = useState(false)
  const [showRoutes, setShowRoutes] = useState(false)
  const [routesLoading, setRoutesLoading] = useState(false)
  const [routeStats, setRouteStats] = useState<{ total: number; loaded: number } | null>(null)

  const clientsOnMap = clients.filter(hasCoords)
  const clientsOff = clients.filter(c => !hasCoords(c))
  const acopioOnMap = collectionPoints.filter(hasCoords)
  const acopioOff = collectionPoints.filter(p => !hasCoords(p))

  // Draw and remove routes
  const updateRoutes = useCallback(async (L: any, map: any, show: boolean) => {
    // Clear existing routes
    routeLayersRef.current.forEach(l => { try { l.remove() } catch { /* ignore */ } })
    routeLayersRef.current = []

    if (!show) {
      setRoutesLoading(false)
      setRouteStats(null)
      return
    }

    const acopiosWithCoord = collectionPoints.filter(hasCoords)
    const clientsWithCoord = clients.filter(hasCoords)

    if (acopiosWithCoord.length === 0 || clientsWithCoord.length === 0) {
      setRoutesLoading(false)
      return
    }

    const totalRoutes = acopiosWithCoord.length * clientsWithCoord.length
    setRoutesLoading(true)
    setRouteStats({ total: totalRoutes, loaded: 0 })

    let loadedCount = 0

    // Process sequentially to avoid spamming OSRM
    for (let ai = 0; ai < acopiosWithCoord.length; ai++) {
      const acopio = acopiosWithCoord[ai]
      const acopioCoord = getEntityCoord(acopio)!
      const color = ACOPIO_COLORS[ai % ACOPIO_COLORS.length]

      for (const client of clientsWithCoord) {
        const clientCoord = getEntityCoord(client)!

        // Skip if same point
        if (
          Math.abs(acopioCoord[0] - clientCoord[0]) < 0.0001 &&
          Math.abs(acopioCoord[1] - clientCoord[1]) < 0.0001
        ) continue

        const routeData = await fetchOsrmRoute(acopioCoord, clientCoord)

        let coords: [number, number][]
        let distance: number
        let duration: number
        let isFallback = false

        if (routeData) {
          coords = routeData.coords
          distance = routeData.distance
          duration = routeData.duration
        } else {
          // Fallback: straight line with estimated values
          coords = buildRouteFallback(acopioCoord, clientCoord)
          const km = haversineKm(acopioCoord, clientCoord)
          distance = km * 1000
          duration = (km / 60) * 3600 // assume 60 km/h
          isFallback = true
        }

        const popupHtml = buildRoutePopup(acopio, client, color, distance, duration, isFallback)

        const line = L.polyline(coords, {
          color,
          weight: isFallback ? 2 : 3,
          opacity: isFallback ? 0.5 : 0.75,
          dashArray: isFallback ? '6 5' : undefined,
          lineJoin: 'round',
          lineCap: 'round',
        }).addTo(map)

        line.bindPopup(popupHtml, { maxWidth: 300, className: 'sarg-client-popup' })

        // Hover highlight
        line.on('mouseover', function (this: any) {
          this.setStyle({ weight: isFallback ? 3 : 5, opacity: 1 })
        })
        line.on('mouseout', function (this: any) {
          this.setStyle({ weight: isFallback ? 2 : 3, opacity: isFallback ? 0.5 : 0.75 })
        })

        routeLayersRef.current.push(line)

        loadedCount++
        setRouteStats({ total: totalRoutes, loaded: loadedCount })

        // Small delay between requests to be polite to the public OSRM server
        await new Promise(r => setTimeout(r, 120))
      }
    }

    setRoutesLoading(false)
  }, [clients, collectionPoints])

  useEffect(() => {
    let map: any = null
    let dead = false

    getLeaflet().then(L => {
      if (dead || !containerRef.current) return
      if ((containerRef.current as any)._mapInit) return
      ;(containerRef.current as any)._mapInit = true

      const satellite = L.tileLayer(SATELLITE_TILES, { attribution: SATELLITE_ATTR, maxZoom: 19 })
      const street = L.tileLayer(STREET_TILES, { attribution: STREET_ATTR, maxZoom: 19 })
      const labels = L.tileLayer(LABELS_TILES, { attribution: LABELS_ATTR, maxZoom: 19, pane: 'overlayPane' })
      const satWithLabels = L.layerGroup([
        L.tileLayer(SATELLITE_TILES, { attribution: SATELLITE_ATTR, maxZoom: 19 }),
        labels,
      ])

      map = L.map(containerRef.current, {
        center: RIVIERA_CENTER,
        zoom: DEFAULT_ZOOM,
        layers: [street],
        zoomControl: false,
      })

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      L.control.layers(
        {
          'Mapa': street,
          'Satélite': satellite,
          'Satélite + Etiquetas': satWithLabels,
        },
        {},
        { position: 'topright', collapsed: true }
      ).addTo(map)

      map.fitBounds(RIVIERA_BOUNDS, { padding: [20, 20] })
      mapRef.current = map

      const stored = containerRef.current as any
      drawClients(L, map, stored._clients || [])
      drawAcopio(L, map, stored._acopio || [])
      drawTasks(L, map, stored._tasks || [])
      drawAssets(L, map, stored._assets || [], stored._tasks || [])

      setTimeout(() => map.invalidateSize(), 200)
      setReady(true)
    })

    return () => {
      dead = true
      if (map) map.remove()
      if (containerRef.current) delete (containerRef.current as any)._mapInit
      mapRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (containerRef.current) {
      const stored = containerRef.current as any
      stored._clients = clients
      stored._acopio = collectionPoints
      stored._tasks = tasks
      stored._assets = assets
    }
  }, [clients, collectionPoints, tasks, assets])

  useEffect(() => {
    if (!ready || !mapRef.current) return
    getLeaflet().then(L => { drawClients(L, mapRef.current, clients) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, clients])

  useEffect(() => {
    if (!ready || !mapRef.current) return
    getLeaflet().then(L => { drawAcopio(L, mapRef.current, collectionPoints) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, collectionPoints])

  useEffect(() => {
    if (!ready || !mapRef.current) return
    getLeaflet().then(L => { drawTasks(L, mapRef.current, tasks) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, tasks])

  useEffect(() => {
    if (!ready || !mapRef.current) return
    getLeaflet().then(L => { drawAssets(L, mapRef.current, assets, tasks) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, assets, tasks])

  // Toggle routes layer
  useEffect(() => {
    if (!ready || !mapRef.current) return
    getLeaflet().then(L => { updateRoutes(L, mapRef.current, showRoutes) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, showRoutes])

  // Re-draw routes when data changes while layer is active
  useEffect(() => {
    if (!ready || !mapRef.current || !showRoutes) return
    getLeaflet().then(L => { updateRoutes(L, mapRef.current, true) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, collectionPoints])

  function drawClients(L: any, map: any, clientList: Client[]) {
    clientLayersRef.current.forEach(l => { try { l.remove() } catch { /* ignore */ } })
    clientLayersRef.current = []

    clientList.forEach(client => {
      const hasArea = client.work_area && client.work_area.length >= 3
      const hasPoint = client.latitude != null && client.longitude != null
      if (!hasArea && !hasPoint) return

      const popupHtml = buildClientPopup(client)
      const popupOpts = { maxWidth: 260, className: 'sarg-client-popup' }

      if (hasArea) {
        const pts = client.work_area as [number, number][]
        const poly = L.polygon(pts, {
          color: '#0d9488', weight: 2, fillColor: '#0d9488', fillOpacity: 0.18,
        }).addTo(map)
        poly.bindPopup(popupHtml, popupOpts)
        clientLayersRef.current.push(poly)

        const centroid = getCentroid(pts)
        const marker = L.marker(centroid, {
          icon: buildPinIcon(L, '#0d9488'),
          title: client.name,
        }).addTo(map)
        marker.bindPopup(popupHtml, popupOpts)
        clientLayersRef.current.push(marker)
      } else if (hasPoint) {
        const marker = L.marker([client.latitude!, client.longitude!], {
          icon: buildPinIcon(L, '#0ea5e9'),
          title: client.name,
        }).addTo(map)
        marker.bindPopup(popupHtml, popupOpts)
        clientLayersRef.current.push(marker)
      }
    })
  }

  function drawAcopio(L: any, map: any, pointList: CollectionPoint[]) {
    acopioLayersRef.current.forEach(l => { try { l.remove() } catch { /* ignore */ } })
    acopioLayersRef.current = []

    pointList.forEach((point, ai) => {
      const hasArea = point.work_area && point.work_area.length >= 3
      const hasPt = point.latitude != null && point.longitude != null
      if (!hasArea && !hasPt) return

      const color = ACOPIO_COLORS[ai % ACOPIO_COLORS.length]
      const popupHtml = buildAcopioPopup(point, color)
      const popupOpts = { maxWidth: 260, className: 'sarg-client-popup' }

      if (hasArea) {
        const pts = point.work_area as [number, number][]
        const poly = L.polygon(pts, {
          color, weight: 2.5, fillColor: color, fillOpacity: 0.18, dashArray: '6 4',
        }).addTo(map)
        poly.bindPopup(popupHtml, popupOpts)
        acopioLayersRef.current.push(poly)

        const centroid = getCentroid(pts)
        const marker = L.marker(centroid, {
          icon: buildAcopioIcon(L, color),
          title: point.name,
        }).addTo(map)
        marker.bindPopup(popupHtml, popupOpts)
        acopioLayersRef.current.push(marker)
      } else if (hasPt) {
        const marker = L.marker([point.latitude!, point.longitude!], {
          icon: buildAcopioIcon(L, color),
          title: point.name,
        }).addTo(map)
        marker.bindPopup(popupHtml, popupOpts)
        acopioLayersRef.current.push(marker)
      }
    })
  }

  function drawTasks(L: any, map: any, taskList: Task[]) {
    taskLayersRef.current.forEach(l => { try { l.remove() } catch { /* ignore */ } })
    taskLayersRef.current = []

    taskList.forEach(task => {
      const coord = getEntityCoord(task) || (task.client ? getEntityCoord(task.client) : null)
      if (!coord) return

      const color = task.status === 'en_progreso' ? '#f97316' : '#f59e0b'
      const popupHtml = buildTaskPopup(task)
      const popupOpts = { maxWidth: 260, className: 'sarg-client-popup' }

      const marker = L.marker(coord, {
        icon: buildTaskIcon(L, color),
        title: task.title,
        zIndexOffset: 1000,
      }).addTo(map)

      marker.bindPopup(popupHtml, popupOpts)
      taskLayersRef.current.push(marker)
    })
  }

  function drawAssets(L: any, map: any, assetList: Asset[], taskList: Task[]) {
    assetLayersRef.current.forEach(l => { try { l.remove() } catch { /* ignore */ } })
    assetLayersRef.current = []

    assetList.forEach(asset => {
      const operator = asset.assigned_operator
      let assetCoord: [number, number] | null = null
      let isSimulated = false

      // 1. Priority: Real operator geolocalization
      if (operator && operator.latitude != null && operator.longitude != null) {
        assetCoord = [operator.latitude, operator.longitude]
      } 
      // 2. Fallback: Task location (if operational and no real GPS)
      else if (asset.status === 'en_uso' && asset.current_task_id) {
        const relatedTask = taskList.find(t => t.id === asset.current_task_id)
        if (relatedTask) {
          const coord = getEntityCoord(relatedTask) || (relatedTask.client ? getEntityCoord(relatedTask.client) : null)
          if (coord) {
            // Offset slightly to avoid hiding the task marker
            assetCoord = [coord[0] + 0.0003, coord[1] + 0.0003]
            isSimulated = true
          }
        }
      }

      if (!assetCoord) return

      const popupHtml = buildAssetPopup(asset)
      // Append info about location source
      const sourceHtml = isSimulated 
        ? `<div style="font-size:10px;color:#f59e0b;margin-top:4px;font-style:italic;">📍 Ubicación estimada (en zona de tarea)</div>`
        : `<div style="font-size:10px;color:#0d9488;margin-top:4px;font-style:italic;">📡 GPS en tiempo real (Operador: ${operator?.name})</div>`
      
      const fullPopupHtml = popupHtml.replace('</div>', `${sourceHtml}</div>`)

      const marker = L.marker(assetCoord, {
        icon: buildAssetIcon(L, asset.type),
        title: asset.name,
        zIndexOffset: 2000,
      }).addTo(map)

      marker.bindPopup(fullPopupHtml, { maxWidth: 260, className: 'sarg-client-popup' })
      assetLayersRef.current.push(marker)
    })
  }

  const routeButtonLabel = routesLoading
    ? `Calculando… ${routeStats ? `${routeStats.loaded}/${routeStats.total}` : ''}`
    : showRoutes
    ? 'Ocultar Rutas'
    : 'Ver Rutas'

  return (
    <div className="relative w-full h-full">
      {!ready && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-50">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-zinc-500">Cargando mapa…</p>
        </div>
      )}

      {ready && (
        <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1.5 pointer-events-none">
          {/* Summary badge */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-zinc-200 px-3 py-2 pointer-events-auto">
            <p className="text-xs font-semibold text-zinc-800">
              {clientsOnMap.length} cliente{clientsOnMap.length !== 1 ? 's' : ''}
              {' · '}
              {acopioOnMap.length} acopio{acopioOnMap.length !== 1 ? 's' : ''}
            </p>
            {(clientsOff.length > 0 || acopioOff.length > 0) && (
              <p className="text-xs text-zinc-400 mt-0.5">
                {clientsOff.length + acopioOff.length} sin ubicación
              </p>
            )}
          </div>

          {/* Routes toggle */}
          {acopioOnMap.length > 0 && clientsOnMap.length > 0 && (
            <button
              onClick={() => !routesLoading && setShowRoutes(v => !v)}
              disabled={routesLoading}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg border text-xs font-semibold transition-all pointer-events-auto ${
                showRoutes
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white/90 backdrop-blur-sm text-zinc-700 border-zinc-200 hover:bg-zinc-50'
              } disabled:opacity-60 disabled:cursor-wait`}
            >
              {routesLoading ? (
                <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
              ) : (
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25M3 12h18" />
                </svg>
              )}
              {routeButtonLabel}
            </button>
          )}

          {/* Legend */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-zinc-200 px-3 py-2 space-y-1 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ background: '#0d9488' }} />
              <span className="text-xs text-zinc-600">Cliente c/ área</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ background: '#0ea5e9' }} />
              <span className="text-xs text-zinc-600">Cliente c/ coord.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-sm flex-shrink-0" style={{ background: '#f97316' }} />
              <span className="text-xs text-zinc-600">Punto de acopio</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full flex-shrink-0 border-2 border-white shadow-sm" style={{ background: '#f59e0b' }} />
              <span className="text-xs text-zinc-600">Tarea activa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-teal-600 rounded-full flex items-center justify-center text-[8px] shadow-sm">🚤</div>
              <span className="text-xs text-zinc-600">Activo (en uso)</span>
            </div>
            {showRoutes && (
              <div className="flex items-center gap-2 border-t border-zinc-100 pt-1 mt-1">
                <span className="inline-block w-4 h-0.5 rounded flex-shrink-0" style={{ background: '#f97316' }} />
                <span className="text-xs text-zinc-600">Ruta por carretera</span>
              </div>
            )}
          </div>

          {/* Acopio color legend when routes are shown */}
          {showRoutes && acopioOnMap.length > 1 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-zinc-200 px-3 py-2 space-y-1 pointer-events-none max-w-[180px]">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">Puntos de Acopio</p>
              {acopioOnMap.map((ap, i) => (
                <div key={ap.id} className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ background: ACOPIO_COLORS[i % ACOPIO_COLORS.length] }}
                  />
                  <span className="text-xs text-zinc-700 truncate">{ap.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />

      <style>{`
        .leaflet-container { background: #c8d8e8; }
        .sarg-client-popup .leaflet-popup-content-wrapper {
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
          padding: 8px;
        }
        .sarg-client-popup .leaflet-popup-content {
          margin: 12px 16px;
          line-height: 1.5;
        }
        .sarg-client-popup .leaflet-popup-close-button {
          top: 8px !important;
          right: 8px !important;
          color: #94a3b8 !important;
          font-size: 16px !important;
        }
        .sarg-client-popup .leaflet-popup-tip-container {
          margin-top: -1px;
        }
      `}</style>
    </div>
  )
}
