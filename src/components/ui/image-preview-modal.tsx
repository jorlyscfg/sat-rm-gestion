'use client'

import { useEffect } from 'react'

interface ImagePreviewModalProps {
  url: string
  onClose: () => void
}

export function ImagePreviewModal({ url, onClose }: ImagePreviewModalProps) {
  // Lock scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => {
      document.body.style.overflow = 'auto'
      window.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 transition-all animate-in fade-in backdrop-blur-sm"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative max-w-5xl w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
        <img 
          src={url} 
          alt="Preview" 
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
        />
      </div>
    </div>
  )
}
