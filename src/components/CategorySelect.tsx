import { useEffect, useRef, useState } from 'react'
import type { TicketCategoria } from '../types/ticket'
import { CATEGORIAS } from '../constants/ticketOptions'

interface CategorySelectProps {
  value: TicketCategoria
  onChange: (value: TicketCategoria) => void
  className?: string
  id?: string
}

export function CategorySelect({
  value,
  onChange,
  className = '',
  id,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = CATEGORIAS.find((c) => c.value === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 ${className}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={id ? `${id}-label` : undefined}
      >
        <span>
          {selected?.label ?? value}
          {selected?.descricao && (
            <span className="ml-2 text-xs font-normal text-slate-500">
              {selected.descricao}
            </span>
          )}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          aria-activedescendant={value}
        >
          {CATEGORIAS.map((c) => (
            <li
              key={c.value}
              role="option"
              aria-selected={c.value === value}
              onClick={() => {
                onChange(c.value)
                setOpen(false)
              }}
              className={`flex cursor-pointer items-baseline gap-2 px-3 py-2 text-sm transition-colors ${
                c.value === value
                  ? 'bg-blue-50 text-blue-800'
                  : 'text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span className="font-medium">{c.label}</span>
              {c.descricao && (
                <span className="text-xs text-slate-500">{c.descricao}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
