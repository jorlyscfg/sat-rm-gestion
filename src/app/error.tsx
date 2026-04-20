'use client'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-50 px-4">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L12.75 6.75c-.866-1.5-3.03-1.5-3.896 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-zinc-900">Algo salió mal</h2>
        <p className="text-sm text-zinc-500 mt-1">Ocurrió un error inesperado.</p>
        <button onClick={reset} className="mt-4 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors">
          Reintentar
        </button>
      </div>
    </div>
  )
}