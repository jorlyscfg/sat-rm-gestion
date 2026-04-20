interface StatCardProps {
  label: string
  value: string | number
  color?: string
}

export function StatCard({ label, value, color = 'text-zinc-900' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  )
}