'use client'

import { useState, useId, useRef, useEffect } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  id?: string
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
  )
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
  className = '',
  id: explicitId,
}: SelectProps) {
  const autoId = useId()
  const id = explicitId || autoId
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value)
  const displayLabel = selected?.label ?? placeholder ?? ''

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); buttonRef.current?.focus() }
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('mousedown', onOutside); document.removeEventListener('keydown', onEsc) }
  }, [open])

  useEffect(() => {
    if (open && listRef.current) {
      const active = listRef.current.querySelector('[data-active="true"]')
      if (active) active.scrollIntoView({ block: 'nearest' })
    }
  }, [open])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
    }
  }

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-zinc-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div ref={ref} className="relative">
        <button
          ref={buttonRef}
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(v => !v)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="w-full flex items-center justify-between rounded-lg border border-zinc-300 bg-white py-2.5 pl-3 pr-3 text-left text-sm text-zinc-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={selected ? 'text-zinc-900' : 'text-zinc-400'}>{displayLabel}</span>
          <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div
            ref={listRef}
            role="listbox"
            aria-activedescendant={value}
            className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg max-h-60 overflow-y-auto overscroll-contain"
          >
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={opt.value === value}
                data-active={opt.value === value ? 'true' : undefined}
                onClick={() => { onChange(opt.value); setOpen(false); buttonRef.current?.focus() }}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors active:bg-teal-50 ${
                  opt.value === value
                    ? 'bg-teal-50 text-teal-700 font-medium'
                    : 'text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface CompactSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  className?: string
}

export function CompactSelect({ value, onChange, options, className = '' }: CompactSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const selected = options.find(o => o.value === value)

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); buttonRef.current?.focus() }
    }
    document.addEventListener('mousedown', onOutside)
    document.removeEventListener('keydown', onEsc)
    return () => { document.removeEventListener('mousedown', onOutside); document.removeEventListener('keydown', onEsc) }
  }, [open])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white py-1.5 pl-3 pr-2 text-sm text-zinc-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
      >
        <span>{selected?.label ?? 'Todos'}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-1 left-0 min-w-full rounded-lg border border-zinc-200 bg-white shadow-lg max-h-60 overflow-y-auto overscroll-contain"
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              onClick={() => { onChange(opt.value); setOpen(false); buttonRef.current?.focus() }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors active:bg-teal-50 ${
                opt.value === value
                  ? 'bg-teal-50 text-teal-700 font-medium'
                  : 'text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}