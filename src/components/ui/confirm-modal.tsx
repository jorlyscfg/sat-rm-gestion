import React from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  isDestructive?: boolean
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  isDestructive = false
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-full flex-shrink-0 ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
          </div>
          <p className="text-sm text-zinc-600 mb-6 font-medium">
            {message}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white font-bold transition-colors ${
                isDestructive ? 'bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20' : 'bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-500/20'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
