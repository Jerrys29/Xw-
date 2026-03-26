import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import { Building2, Plus, Phone, Pencil, Trash2, ChevronRight } from 'lucide-react'

export default function ProprietaireDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [prop, setProp] = useState(null)
  const [maisons, setMaisons] = useState([])
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    supabase.from('proprietaires').select('*').eq('id', id).single().then(({ data }) => setProp(data))
    supabase.from('maisons').select('*').eq('proprietaire_id', id).order('nom').then(({ data }) => setMaisons(data ?? []))
  }, [id])

  if (!prop) return <div className="flex-1 flex items-center justify-center text-slate-400">Chargement…</div>

  async function supprimer() {
    await supabase.from('proprietaires').delete().eq('id', id)
    navigate('/proprietaires')
  }

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader title={prop.nom} subtitle={prop.telephone} back actions={
        <div className="flex gap-2">
          <button onClick={() => navigate(`/proprietaires/${id}/edit`)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Pencil size={18} /></button>
          <button onClick={() => setConfirm(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500"><Trash2 size={18} /></button>
        </div>
      } />

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40" onClick={() => setConfirm(false)}>
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-sm p-6 mx-4" onClick={e => e.stopPropagation()}>
            <p className="text-xl font-bold text-slate-900 mb-2">Supprimer ?</p>
            <p className="text-slate-500 mb-6">Toutes les maisons de ce propriétaire seront également supprimées.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 font-bold text-slate-700">Annuler</button>
              <button onClick={supprimer} className="flex-1 py-4 rounded-2xl bg-red-600 font-bold text-white">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 md:pb-6 max-w-3xl mx-auto w-full space-y-4">
        <a href={`tel:${prop.telephone}`} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-4 shadow-sm border border-slate-100">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center"><Phone size={20} className="text-emerald-600" /></div>
          <div className="flex-1">
            <p className="text-xs text-slate-400">Téléphone</p>
            <p className="font-bold text-slate-900">{prop.telephone}</p>
          </div>
          <span className="text-sm font-semibold text-emerald-600">Appeler →</span>
        </a>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Maisons ({maisons.length})</p>
            <button onClick={() => navigate(`/maisons/nouveau?proprietaireId=${id}`)} className="flex items-center gap-1 text-blue-600 text-sm font-bold"><Plus size={16} /> Ajouter</button>
          </div>
          {maisons.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
              <Building2 size={28} className="mx-auto mb-2 text-slate-300" />
              <p className="text-slate-500 font-medium">Aucune maison</p>
            </div>
          )}
          <div className="space-y-2">
            {maisons.map(m => <MaisonRow key={m.id} maison={m} onClick={() => navigate(`/maisons/${m.id}`)} />)}
          </div>
        </div>
      </div>
    </div>
  )
}

function MaisonRow({ maison, onClick }) {
  const [counts, setCounts] = useState({ libres: 0, occupes: 0 })
  useEffect(() => {
    supabase.from('menages').select('statut').eq('maison_id', maison.id).then(({ data }) => {
      const rows = data ?? []
      setCounts({ libres: rows.filter(r => r.statut === 'libre').length, occupes: rows.filter(r => r.statut === 'occupé').length })
    })
  }, [maison.id])

  return (
    <button onClick={onClick} className="w-full text-left bg-white rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm border border-slate-100 active:bg-slate-50">
      <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0"><Building2 size={20} className="text-blue-500" /></div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 text-sm truncate">{maison.nom}</p>
        <p className="text-xs text-slate-400">{maison.quartier} · {maison.ville}</p>
        <div className="flex gap-2 mt-1.5">
          {counts.libres  > 0 && <span className="text-[11px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">{counts.libres} libre{counts.libres > 1 ? 's' : ''}</span>}
          {counts.occupes > 0 && <span className="text-[11px] bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 rounded-full">{counts.occupes} occupé{counts.occupes > 1 ? 's' : ''}</span>}
        </div>
      </div>
      <ChevronRight size={20} className="text-slate-300 flex-shrink-0" />
    </button>
  )
}
