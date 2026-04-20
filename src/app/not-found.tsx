import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-zinc-200">404</h1>
        <h2 className="text-lg font-semibold text-zinc-900 mt-2">Página no encontrada</h2>
        <p className="text-sm text-zinc-500 mt-1">La página que buscas no existe.</p>
        <Link href="/gestion" className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors">
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}