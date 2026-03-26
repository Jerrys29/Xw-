import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useOfflineData } from '../hooks/useOfflineData'
import PageHeader from '../components/PageHeader'
import { Users, Plus, Phone, ChevronRight, WifiOff, Building2 } from 'lucide-react'

const COLORS = ['bg-blue-500', 'bg-violet-500', 'bg-orange-500', 'bg-emerald-500', 'bg-pink-500', 'bg-amber-500']

export default function Proprietaires() {
  const navigate = useNavigate()
  const { data: list, loading, offline } = useOfflineData(
    'proprietaires',
    async () => {
      const { data } = await supabase
        .from('proprietaires')
        .select('*, maisons(count)')
        .order('nom')
      return data ?? []
    }
  )

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader title="Propriétaires" actions={
        <button onClick={() => navigate('/proprietaires/nouveau')}
          className="flex items-center gap-1.5 bg-blue-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm active:bg-blue-700">
          <Plus size={18} /> Ajouter
        </button>
      } />

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 md:pb-6 space-y-3 max-w-3xl mx-auto w-full">
        {offline && list.length > 0 && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs font-semibold">
            <WifiOff size={13} /> Données en cache — hors ligne
          </div>
        )}
        {!loading && list.length === 0 && (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={36} className="text-blue-400" />
            </div>
            <p className="text-lg font-bold text-slate-700">Aucun propriétaire</p>
            <p className="text-slate-400 text-sm mt-1">Appuyez sur Ajouter pour commencer</p>
          </div>
        )}
        {list.map((p, i) => {
          const initials    = p.nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
          const nbMaisons   = p.maisons?.[0]?.count ?? 0
          return (
            <button key={p.id} onClick={() => navigate(`/proprietaires/${p.id}`)}
              className="w-full text-left bg-white rounded-2xl px-4 py-4 flex items-center gap-4 shadow-sm border border-slate-100 active:bg-slate-50">

              {/* Avatar */}
              <div className={`w-12 h-12 rounded-xl ${COLORS[i % COLORS.length]} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-bold text-base">{initials}</span>
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-base truncate">{p.nom}</p>
                <p className="text-sm text-slate-400 flex items-center gap-1 mt-0.5">
                  <Phone size={12} /> {p.telephone}
                </p>
                {/* Badge maisons */}
                <div className="flex items-center gap-1 mt-1.5">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    nbMaisons > 0 ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Building2 size={11} />
                    {nbMaisons === 0 ? 'Aucune maison' : `${nbMaisons} maison${nbMaisons > 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>

              <ChevronRight size={20} className="text-slate-300 flex-shrink-0" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
