import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import { Building2, Plus, MapPin, ChevronRight } from 'lucide-react'

export default function Maisons() {
  const navigate = useNavigate()
  const [maisons, setMaisons] = useState([])
  const [menages, setMenages] = useState([])
  const [proprios, setProprios] = useState({})
  const [filtre, setFiltre] = useState('toutes')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('maisons').select('*').order('nom'),
      supabase.from('menages').select('maison_id,statut'),
      supabase.from('proprietaires').select('id,nom'),
    ]).then(([{ data: m }, { data: men }, { data: p }]) => {
      setMaisons(m ?? [])
      setMenages(men ?? [])
      setProprios(Object.fromEntries((p ?? []).map(x => [x.id, x.nom])))
      setLoading(false)
    })
  }, [])

  const counts = (maisonId) => {
    const rows = menages.filter(m => m.maison_id === maisonId)
    return { libres: rows.filter(r => r.statut === 'libre').length, occupes: rows.filter(r => r.statut === 'occupé').length, total: rows.length }
  }

  const filtered = maisons.filter(m => {
    const c = counts(m.id)
    if (filtre === 'dispo') return c.libres > 0
    if (filtre === 'plein') return c.libres === 0 && c.total > 0
    return true
  })

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader title="Maisons" actions={
        <button onClick={() => navigate('/maisons/nouveau')} className="flex items-center gap-1.5 bg-blue-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm"><Plus size={18} /> Ajouter</button>
      } />

      <div className="px-4 pt-3 pb-1 flex gap-2 max-w-3xl mx-auto w-full">
        {[['toutes','Toutes'],['dispo','Avec dispo'],['plein','Pleines']].map(([v,l]) => (
          <button key={v} onClick={() => setFiltre(v)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filtre === v ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 pb-24 md:pb-6 space-y-3 max-w-3xl mx-auto w-full">
        {!loading && filtered.length === 0 && (
          <div className="text-center py-24">
            <Building2 size={36} className="mx-auto mb-3 text-slate-300" />
            <p className="text-lg font-bold text-slate-700">Aucune maison</p>
          </div>
        )}
        {filtered.map(m => {
          const c = counts(m.id)
          return (
            <button key={m.id} onClick={() => navigate(`/maisons/${m.id}`)}
              className="w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-slate-100 active:bg-slate-50">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0"><Building2 size={22} className="text-blue-500" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-base truncate">{m.nom}</p>
                  <p className="text-sm text-slate-400 truncate">{proprios[m.proprietaire_id] ?? 'Propriétaire inconnu'}</p>
                </div>
                <ChevronRight size={20} className="text-slate-300 flex-shrink-0 mt-1" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin size={12} /> {m.quartier}, {m.ville}
                  {m.latitude && <span className="text-emerald-500 font-bold ml-1">· GPS ✓</span>}
                </div>
                <div className="flex gap-2">
                  {c.libres  > 0 && <span className="text-[11px] bg-blue-50 text-blue-600 font-bold px-2.5 py-1 rounded-full">{c.libres} libre{c.libres > 1 ? 's' : ''}</span>}
                  {c.occupes > 0 && <span className="text-[11px] bg-emerald-50 text-emerald-600 font-bold px-2.5 py-1 rounded-full">{c.occupes} occupé{c.occupes > 1 ? 's' : ''}</span>}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
