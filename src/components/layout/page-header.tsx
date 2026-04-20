'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  action?: { label: string; href: string }
}

export function PageHeader({ title, subtitle, backHref, action }: PageHeaderProps) {
  const router = useRouter()

  return (
    <div className="sticky top-14 z-40 bg-white border-b border-zinc-200 px-4 py-3">
      <div className="flex items-center gap-3">
        {backHref && (
          <button onClick={() => router.back()} className="p-1 -ml-1 text-zinc-600 hover:text-zinc-900">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-zinc-900 truncate">{title}</h1>
          {subtitle && <p className="text-xs text-zinc-500 truncate">{subtitle}</p>}
        </div>
        {action && (
          <Link href={action.href} className="px-3 py-1.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors">
            {action.label}
          </Link>
        )}
      </div>
    </div>
  )
}