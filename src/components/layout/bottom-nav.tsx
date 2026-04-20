'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Inicio', icon: HomeIcon },
  { href: '/mapa', label: 'Mapa', icon: MapIcon },
  { href: '/alertas', label: 'Alertas', icon: BellIcon },
  { href: '/profile', label: 'Perfil', icon: UserIcon },
]

export function BottomNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                active ? 'text-teal-600' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <Icon className="w-5 h-5" active={active} />
              <span className="font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function HomeIcon({ className, active }: { className?: string; active?: boolean }) {
  return active ? (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
  ) : (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v8.25a1.5 1.5 0 001.5 1.5h3a1.5 1.5 0 001.5-1.5v-4.5a1.5 1.5 0 011.5-1.5h1.5a1.5 1.5 0 011.5 1.5v4.5a1.5 1.5 0 001.5 1.5h3a1.5 1.5 0 001.5-1.5V9.75" /></svg>
  )
}

function MapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.227-.114.443-.278.602-.476.16-.198.25-.436.25-.684V4.462c0-.318-.126-.624-.353-.849a1.215 1.215 0 00-.851-.348H15.36a1.22 1.22 0 00-.865.36L12.015 6.6l-2.483-2.484A1.22 1.22 0 008.666 3.75H4.626c-.319 0-.625.126-.85.351a1.19 1.19 0 00-.35.849v11.25c0 .248.09.486.25.684.159.198.375.362.602.476l4.875 2.437c.312.156.667.234 1.029.234.362 0 .717-.078 1.029-.234l4.875-2.437z" /></svg>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
  )
}

function UserIcon({ className, active }: { className?: string; active?: boolean }) {
  return active ? (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
  ) : (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
  )
}