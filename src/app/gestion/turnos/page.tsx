'use client'

import { useEffect, useState } from 'react'
import { getShifts } from '@/app/actions/shifts'
import { BottomNav } from '@/components/layout/bottom-nav'
import { StatusBadge } from '@/components/ui/status-badge'
import { SHIFT_TYPE_LABELS, SHIFT_STATUS_LABELS } from '@/lib/utils'
import type { Shift } from '@/types'

export default function TurnosPage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadShifts() }, [])

  async function loadShifts() {
    const result = await getShifts()
    if (result.data) setShifts(result.data)
    setLoading(false)
  }

  const active = shifts.filter(s => ['programado', 'activo'].includes(s.status))
  const history = shifts.filter(s => ['completado', 'cancelado'].includes(s.status))

  return (
    <div className="flex-1 pt-14 pb-20">
      <div className="px-4 py-3 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 mb-2">Activos</h2>
          {loading ? (
            <div className="text-center py-4 text-zinc-500 text-sm">Cargando...</div>
          ) : active.length === 0 ? (
            <div className="text-center py-4 text-zinc-400 text-sm">Sin turnos activos</div>
          ) : (
            <div className="space-y-2">
              {active.map(shift => (
                <div key={shift.id} className="bg-white rounded-xl border border-zinc-200 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">
                        {SHIFT_TYPE_LABELS[shift.type]} — {new Date(shift.date).toLocaleDateString('es-MX')}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Coordinador: {shift.coordinator?.name || '—'}
                      </p>
                    </div>
                    <StatusBadge
                      label={SHIFT_STATUS_LABELS[shift.status]}
                      colorClass={shift.status === 'activo' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                    />
                  </div>
                  {shift.scheduled_start && (
                    <p className="text-xs text-zinc-400 mt-1">
                      {shift.scheduled_start} — {shift.scheduled_end}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-zinc-900 mb-2">Historial</h2>
          {history.length === 0 ? (
            <div className="text-center py-4 text-zinc-400 text-sm">Sin historial</div>
          ) : (
            <div className="space-y-2">
              {history.map(shift => (
                <div key={shift.id} className="bg-white rounded-xl border border-zinc-200 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium text-zinc-900">
                        {SHIFT_TYPE_LABELS[shift.type]} — {new Date(shift.date).toLocaleDateString('es-MX')}
                      </h3>
                    </div>
                    <StatusBadge
                      label={SHIFT_STATUS_LABELS[shift.status]}
                      colorClass={shift.status === 'completado' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}