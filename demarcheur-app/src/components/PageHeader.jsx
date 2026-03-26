import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PageHeader({ title, subtitle, back, actions }) {
  const navigate = useNavigate()
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-slate-100 px-4 py-3">
      <div className="flex items-center gap-3">
        {back && (
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:bg-slate-200 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-slate-900 truncate leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 truncate">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
