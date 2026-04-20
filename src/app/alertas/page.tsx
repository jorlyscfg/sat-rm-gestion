import { BottomNav } from '@/components/layout/bottom-nav'

export default function AlertasPage() {
  return (
    <div className="flex-1 pt-14 pb-20">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-zinc-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
          <h3 className="text-base font-semibold text-zinc-900">Módulo de Alertas</h3>
          <p className="text-sm text-zinc-500 mt-1">Disponible en futuras fases</p>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}