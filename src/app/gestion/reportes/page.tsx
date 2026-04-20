'use client'

import { useEffect, useState } from 'react'
import { getTaskStats } from '@/app/actions/tasks'
import { BottomNav } from '@/components/layout/bottom-nav'
import { StatCard } from '@/components/ui/stat-card'

export default function ReportesPage() {
  const [loading, setLoading] = useState(true)
  const [taskStats, setTaskStats] = useState({ total: 0, completadas: 0, canceladas: 0 })
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    const result = await getTaskStats()
    if (result.data) {
      setTaskStats({
        total: result.data.total,
        completadas: result.data.completada || 0,
        canceladas: result.data.cancelada || 0,
      })
    }
    setLoading(false)
  }

  const completionRate = taskStats.total > 0
    ? Math.round((taskStats.completadas / taskStats.total) * 100)
    : 0

  return (
    <div className="flex-1 pt-14 pb-20">
      <div className="px-4 py-3 space-y-4">
        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.from}
            onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg text-sm"
          />
          <input
            type="date"
            value={dateRange.to}
            onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-zinc-900 mb-2">Tareas</h2>
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Total" value={taskStats.total} />
            <StatCard label="Completadas" value={taskStats.completadas} color="text-green-600" />
            <StatCard label="Canceladas" value={taskStats.canceladas} color="text-red-600" />
            <StatCard label="% Completado" value={`${completionRate}%`} color="text-teal-600" />
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}