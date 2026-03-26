import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import { Users, Plus, Phone, ChevronRight } from 'lucide-react'

const COLORS = ['bg-blue-500', 'bg-violet-500', 'bg-orange-500', 'bg-emerald-500', 'bg-pink-500', 'bg-amber-500']

export default function Proprietaires() {
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('proprietaires').select('*').order('nom')
      .then(({ data }) => { setList(data ?? []); setLoading(false) })
  }, [])

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader title="Propriétaires" actions={
        <button onClick={() => navigate('/proprietaires/nouveau')}
          className="flex items-center gap-1.5 bg-blue-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm active:bg-blue-700">
          <Plus size={18} /> Ajouter
        </button>
      } />

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 md:pb-6 space-y-3 max-w-3xl mx-auto w-full">
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
          const initials = p.nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
          return (
            <button key={p.id} onClick={() => navigate(`/proprietaires/${p.id}`)}
              className="w-full text-left bg-white rounded-2xl px-4 py-4 flex items-center gap-4 shadow-sm border border-slate-100 active:bg-slate-50">
              <div className={`w-12 h-12 rounded-xl ${COLORS[i % COLORS.length]} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-bold text-base">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-base truncate">{p.nom}</p>
                <p className="text-sm text-slate-400 flex items-center gap-1 mt-0.5"><Phone size={12} /> {p.telephone}</p>
              </div>
              <ChevronRight size={20} className="text-slate-300 flex-shrink-0" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
