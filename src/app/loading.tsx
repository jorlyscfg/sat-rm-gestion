export default function Loading() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-50">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-zinc-500">Cargando...</p>
      </div>
    </div>
  )
}