import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import { Users, Phone, Home, ChevronRight, Search } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const COLORS = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500']

export default function Locataires() {
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('locataires').select('*, menages(numero,type), maisons(nom,quartier)').order('nom')
      .then(({ data }) => { setList(data ?? []); setLoading(false) })
  }, [])

  const filtered = list.filter(l =>
    l.nom.toLowerCase().includes(search.toLowerCase()) || l.telephone?.includes(search)
  )

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader title="Locataires" />
      <div className="px-4 pt-3 pb-2 max-w-3xl mx-auto w-full">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
            className="w-full bg-white border-2 border-slate-200 focus:border-blue-500 rounded-2xl pl-11 pr-4 py-3.5 text-base outline-none" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 md:pb-6 pt-2 space-y-2 max-w-3xl mx-auto w-full">
        {!loading && filtered.length === 0 && (
          <div className="text-center py-24">
            <Users size={36} className="mx-auto mb-3 text-slate-300" />
            <p className="text-lg font-bold text-slate-700">{search ? 'Aucun résultat' : 'Aucun locataire'}</p>
            <p className="text-slate-400 text-sm mt-1">{search ? 'Essayez un autre nom' : 'Assignez des locataires depuis les maisons'}</p>
          </div>
        )}
        {filtered.map((l, i) => {
          const initials = l.nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
          return (
            <button key={l.id} onClick={() => navigate(`/maisons/${l.maison_id}/menages/${l.menage_id}`)}
              className="w-full text-left bg-white rounded-2xl px-4 py-4 flex items-center gap-4 shadow-sm border border-slate-100 active:bg-slate-50">
              <div className={`w-12 h-12 rounded-xl ${COLORS[i % COLORS.length]} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-bold text-base">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-base truncate">{l.nom}</p>
                <p className="text-sm text-slate-400 flex items-center gap-1"><Phone size={12} /> {l.telephone}</p>
                {l.menages && l.maisons && (
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                    <Home size={11} /> {l.menages.numero} · {l.maisons.nom}
                  </p>
                )}
                {l.date_entree && <p className="text-xs text-slate-300 mt-0.5">Depuis {format(new Date(l.date_entree), 'd MMM yyyy', { locale: fr })}</p>}
              </div>
              <ChevronRight size={20} className="text-slate-300 flex-shrink-0" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
