import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Search, X, Check } from 'lucide-react'

const PAGE_SIZE = 20

/**
 * Select searchable avec pagination infinie au scroll
 * Props:
 *   value       string | null     — valeur sélectionnée
 *   onChange    (val) => void
 *   options     [{ value, label }]
 *   placeholder string
 *   label       string (optionnel)
 *   clearable   bool (optionnel, défaut true)
 */
export default function SearchSelect({ value, onChange, options = [], placeholder = 'Choisir…', label, clearable = true }) {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)
  const ref      = useRef(null)
  const listRef  = useRef(null)
  const inputRef = useRef(null)

  const filtered = options.filter(o =>
    !search || o.label.toLowerCase().includes(search.toLowerCase())
  )
  const visible = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = visible.length < filtered.length
  const selected = options.find(o => o.value === value)

  // Reset pagination quand la recherche change
  useEffect(() => { setPage(1) }, [search])

  // Fermer au clic extérieur
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus input quand le dropdown s'ouvre
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  // Pagination au scroll
  function handleScroll() {
    const el = listRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40 && hasMore) {
      setPage(p => p + 1)
    }
  }

  function select(val) {
    onChange(val)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="block text-sm font-bold text-slate-600 mb-2">{label}</label>
      )}

      {/* Bouton déclencheur */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full bg-white border-2 rounded-2xl px-4 py-4 text-base outline-none flex items-center justify-between transition-colors ${
          open ? 'border-blue-500' : 'border-slate-200'
        }`}
      >
        <span className={selected ? 'text-slate-900 font-medium truncate' : 'text-slate-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {clearable && selected && (
            <span
              role="button"
              onClick={e => { e.stopPropagation(); onChange('') }}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300"
            >
              <X size={11} />
            </span>
          )}
          <ChevronDown size={18} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">

          {/* Champ de recherche */}
          <div className="p-2.5 border-b border-slate-100">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-8 py-2.5 text-sm outline-none focus:border-blue-400"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={14} className="text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Liste */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="max-h-56 overflow-y-auto"
          >
            {/* Option vide */}
            {clearable && (
              <button type="button" onClick={() => select('')}
                className={`w-full text-left px-4 py-3 text-sm border-b border-slate-50 transition-colors ${
                  !value ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-400 hover:bg-slate-50'
                }`}>
                — {placeholder} —
              </button>
            )}

            {/* Aucun résultat */}
            {visible.length === 0 && (
              <p className="text-center py-8 text-sm text-slate-400">Aucun résultat</p>
            )}

            {/* Options */}
            {visible.map(o => (
              <button key={o.value} type="button" onClick={() => select(o.value)}
                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${
                  o.value === value
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}>
                <span className="truncate">{o.label}</span>
                {o.value === value && <Check size={15} className="text-blue-600 flex-shrink-0 ml-2" />}
              </button>
            ))}

            {/* Chargement au scroll */}
            {hasMore && (
              <div className="text-center py-2.5 text-xs text-slate-400 border-t border-slate-100">
                ↓ {filtered.length - visible.length} de plus — faites défiler
              </div>
            )}
          </div>

          {/* Compteur */}
          {filtered.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
              {visible.length} / {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
