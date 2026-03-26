export default function StatusBadge({ status }) {
  const cfg = {
    occupé: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    libre:  { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500' },
  }[status] ?? { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {status === 'occupé' ? 'Occupé' : 'Libre'}
    </span>
  )
}
