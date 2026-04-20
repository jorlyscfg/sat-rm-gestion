'use client'

import { useState } from 'react'
import { createInsForgeClient } from '@/lib/insforge'

interface ImageUploadMultiProps {
  urls: string[]
  onUrlsChange: (urls: string[]) => void
  onPreview?: (url: string) => void
  limit?: number
  bucket?: string
}

export function ImageUploadMulti({ urls, onUrlsChange, onPreview, limit = 5, bucket = 'assets' }: ImageUploadMultiProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const insforge = createInsForgeClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    if (urls.length + files.length > limit) {
      setError(`El límite es de ${limit} imágenes`)
      return
    }

    setError('')
    setUploading(true)

    try {
      const newUrls = [...urls]
      for (const file of files) {
        const path = `${Date.now()}_${file.name}`
        const { data, error: uploadError } = await insforge.storage
          .from(bucket)
          .upload(path, file)

        if (uploadError) throw new Error(uploadError.message)
        if (data) newUrls.push(data.url)
      }
      onUrlsChange(newUrls)
    } catch (err: any) {
      setError('Error al subir imágenes: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const extractKey = (url: string) => {
    // URL format: .../storage/v1/object/public/assets/KEY
    const parts = url.split(`/${bucket}/`)
    return parts.length > 1 ? parts[1] : null
  }

  const removeImage = async (index: number) => {
    const urlToRemove = urls[index]
    const key = extractKey(urlToRemove)

    if (key) {
      await insforge.storage.from(bucket).remove(key)
    }

    const newUrls = [...urls]
    newUrls.splice(index, 1)
    onUrlsChange(newUrls)
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-zinc-700">Imágenes ({urls.length}/{limit})</label>
        {uploading && <span className="text-[10px] text-teal-600 animate-pulse font-medium">Subiendo...</span>}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {urls.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 group">
            <img 
              src={url} 
              alt={`Asset ${i}`} 
              className="w-full h-full object-cover cursor-zoom-in" 
              onClick={() => onPreview?.(url)}
            />
            <button
              onClick={() => removeImage(i)}
              type="button"
              className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}

        {urls.length < limit && (
          <label className={`aspect-square flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50/50 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span className="text-[10px] text-zinc-400 mt-1">Añadir</span>
          </label>
        )}
      </div>

      {error && <p className="text-[10px] text-red-600">{error}</p>}
    </div>
  )
}
