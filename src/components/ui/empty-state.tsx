interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: { label: string; href: string }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="text-zinc-300 mb-3">{icon}</div>}
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      {description && <p className="text-sm text-zinc-500 mt-1 max-w-xs">{description}</p>}
      {action && (
        <a
          href={action.href}
          className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
        >
          {action.label}
        </a>
      )}
    </div>
  )
}