import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { cache } from '../lib/cache'
import { Building2, Home, Users, RefreshCw, WifiOff } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(() => cache.get('dashboard_stats') ?? { libres: [], occupes: 0, maisons: 0, proprietaires: 0 })
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    if (!navigator.onLine) {
      const cached = cache.get('dashboard_stats')
      if (cached) setStats(cached)
      setOffline(true)
      setLoading(false)
      return
    }
    try {
      const [{ data: menages }, { data: maisons }, { data: proprios }] = await Promise.all([
        supabase.from('menages').select('*'),
        supabase.from('maisons').select('id'),
        supabase.from('proprietaires').select('id'),
      ])
      const libres  = (menages ?? []).filter(m => m.statut === 'libre')
      const occupes = (menages ?? []).filter(m => m.statut === 'occupé').length
      const next = { libres, occupes, maisons: (maisons ?? []).length, proprietaires: (proprios ?? []).length }
      cache.set('dashboard_stats', next)
      setStats(next)
      setOffline(false)
    } catch {
      const cached = cache.get('dashboard_stats')
      if (cached) setStats(cached)
      setOffline(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="flex-1 overflow-y-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="bg-blue-600 px-5 pt-8 pb-10 md:pt-6 md:pb-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm font-medium">Bonjour 👋</p>
            <h1 className="text-white text-2xl font-bold mt-0.5">Tableau de bord</h1>
          </div>
          <button onClick={load} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white">
            {offline ? <WifiOff size={17} /> : <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />}
          </button>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-5 max-w-3xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Libres" value={stats.libres.length} icon={<Home size={22} className="text-blue-500" />} bg="bg-blue-50" />
          <StatCard label="Occupés" value={stats.occupes} icon={<Home size={22} className="text-emerald-500" />} bg="bg-emerald-50" />
          <StatCard label="Maisons" value={stats.maisons} icon={<Building2 size={22} className="text-violet-500" />} bg="bg-violet-50" />
          <StatCard label="Propriétaires" value={stats.proprietaires} icon={<Users size={22} className="text-orange-500" />} bg="bg-orange-50" />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <BigBtn label="Ajouter un propriétaire" color="bg-blue-600" onClick={() => navigate('/proprietaires/nouveau')} icon={<Users size={20} />} />
          <BigBtn label="Ajouter une maison" color="bg-violet-600" onClick={() => navigate('/maisons/nouveau')} icon={<Building2 size={20} />} />
        </div>

        {/* Disponibles */}
        {stats.libres.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Disponible maintenant ({stats.libres.length})
            </p>
            <div className="space-y-2">
              {stats.libres.slice(0, 6).map(m => (
                <LibreCard key={m.id} menage={m} onClick={() => navigate(`/maisons/${m.maison_id}`)} />
              ))}
              {stats.libres.length > 6 && (
                <button onClick={() => navigate('/maisons')}
                  className="w-full text-center text-sm text-blue-600 font-bold py-2">
                  Voir tout ({stats.libres.length}) →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, bg }) {
  return (
    <div className={`${bg} rounded-2xl p-4 flex items-center gap-3 shadow-sm`}>
      <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  )
}

function BigBtn({ label, color, onClick, icon }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 ${color} text-white rounded-2xl px-5 py-4 text-base font-bold shadow-sm active:opacity-80 w-full`}>
      {icon} {label}
    </button>
  )
}

function LibreCard({ menage, onClick }) {
  const [maison, setMaison] = useState(null)
  useEffect(() => {
    if (!menage.maison_id) return
    if (!navigator.onLine) {
      const cached = cache.get('maisons') ?? []
      setMaison(cached.find(m => m.id === menage.maison_id) ?? null)
      return
    }
    supabase.from('maisons').select('nom,quartier').eq('id', menage.maison_id).single().then(({ data }) => setMaison(data))
  }, [menage.maison_id])

  return (
    <button onClick={onClick} className="w-full text-left bg-white border border-slate-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm active:bg-slate-50">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
        <Home size={18} className="text-blue-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm truncate">{menage.numero}</p>
        <p className="text-xs text-slate-400 truncate">{maison?.nom ?? '…'} · {maison?.quartier}</p>
      </div>
      <span className="text-sm font-bold text-slate-700 flex-shrink-0">
        {menage.loyer ? `${Number(menage.loyer).toLocaleString('fr-FR')} F` : 'N/A'}
      </span>
    </button>
  )
}
