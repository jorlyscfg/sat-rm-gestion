export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center pt-14 pb-20">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-zinc-500">Cargando...</p>
      </div>
    </div>
  )
}