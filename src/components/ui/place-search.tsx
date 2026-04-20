'use client'

import { useState, useRef, useEffect } from 'react'

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  type: string
  class: string
}

interface PlaceSearchProps {
  onSelect: (name: string, lat: number, lng: number) => void
  value: string
  onChange: (name: string) => void
}

export function PlaceSearch({ onSelect, value, onChange }: PlaceSearchProps) {
  const [results, setResults] = useState<NominatimResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function search(query: string) {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (!query || query.length < 3) {
      setResults([])
      setShowResults(false)
      return
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&viewbox=-92.5,16,-86,23&boundedby=1`,
          { headers: { 'Accept-Language': 'es' } }
        )
        const data = await res.json()
        setResults(data)
        setShowResults(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 500)
  }

  function handleSelect(result: NominatimResult) {
    const shortName = result.display_name.split(',')[0]
    onChange(shortName)
    onSelect(shortName, parseFloat(result.lat), parseFloat(result.lon))
    setShowResults(false)
    setResults([])
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={e => { onChange(e.target.value); search(e.target.value) }}
          onFocus={() => { if (results.length > 0) setShowResults(true) }}
          className="flex-1 px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          placeholder="Buscar hotel, playa, restaurante..."
        />
        {loading && (
          <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border border-zinc-200 shadow-lg max-h-60 overflow-y-auto">
          {results.map(r => (
            <button
              key={r.place_id}
              type="button"
              onClick={() => handleSelect(r)}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-teal-50 transition-colors border-b border-zinc-100 last:border-0"
            >
              <span className="font-medium text-zinc-900">{r.display_name.split(',')[0]}</span>
              <span className="text-xs text-zinc-500 block truncate">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}