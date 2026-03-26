import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import { CheckCircle2, XCircle, Clock, Users, RefreshCw, Search } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUT_CFG = {
  en_attente: { label: 'En attente', bg: 'bg-amber-100', text: 'text-amber-700', icon: <Clock size={14} /> },
  actif:      { label: 'Actif',      bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <CheckCircle2 size={14} /> },
  suspendu:   { label: 'Suspendu',   bg: 'bg-red-100',   text: 'text-red-700',     icon: <XCircle size={14} /> },
}

export default function Admin() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [counts, setCounts]     = useState({ en_attente: 0, actif: 0, suspendu: 0, total: 0 })

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    const rows = data ?? []
    setProfiles(rows)
    setCounts({
      total:      rows.length,
      en_attente: rows.filter(r => r.statut === 'en_attente').length,
      actif:      rows.filter(r => r.statut === 'actif').length,
      suspendu:   rows.filter(r => r.statut === 'suspendu').length,
    })
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function setStatut(id, statut) {
    await supabase.from('profiles').update({ statut }).eq('id', id)
    setProfiles(p => p.map(x => x.id === id ? { ...x, statut } : x))
    setCounts(c => {
      const old = profiles.find(x => x.id === id)?.statut
      return { ...c, [old]: c[old] - 1, [statut]: c[statut] + 1 }
    })
  }

  const filtered = profiles.filter(p => {
    const matchSearch  = !search || p.nom?.toLowerCase().includes(search.toLowerCase()) || p.email?.includes(search) || p.telephone?.includes(search)
    const matchStatut  = filtreStatut === 'tous' || p.statut === filtreStatut
    return matchSearch && matchStatut
  })

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title="Administration"
        subtitle="Gestion des comptes"
        actions={
          <button onClick={load} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 md:pb-6 max-w-3xl mx-auto w-full space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total', value: counts.total, color: 'bg-slate-100 text-slate-700' },
            { label: 'En attente', value: counts.en_attente, color: 'bg-amber-100 text-amber-700' },
            { label: 'Actifs', value: counts.actif, color: 'bg-emerald-100 text-emerald-700' },
            { label: 'Suspendus', value: counts.suspendu, color: 'bg-red-100 text-red-700' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl p-3 text-center`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-[11px] font-semibold leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, email, tél…"
              className="w-full bg-white border-2 border-slate-200 focus:border-blue-500 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['tous', 'en_attente', 'actif', 'suspendu'].map(f => (
              <button key={f} onClick={() => setFiltreStatut(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${filtreStatut === f ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
                {f === 'tous' ? 'Tous' : f === 'en_attente' ? 'En attente' : f === 'actif' ? 'Actifs' : 'Suspendus'}
              </button>
            ))}
          </div>
        </div>

        {/* Liste */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Users size={32} className="mx-auto mb-2" />
            <p>Aucun compte trouvé</p>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map(p => {
            const cfg = STATUT_CFG[p.statut] ?? STATUT_CFG.en_attente
            const initiales = (p.nom ?? p.email ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
            return (
              <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{initiales}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900 text-sm truncate">{p.nom ?? <span className="italic text-slate-400">Sans nom</span>}</p>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {p.role === 'admin' && <span className="text-[11px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">Admin</span>}
                    </div>
                    <p className="text-xs text-slate-400 truncate">{p.email}</p>
                    {p.telephone && <p className="text-xs text-slate-400">{p.telephone}</p>}
                    <p className="text-[11px] text-slate-300 mt-1">
                      Inscrit le {format(new Date(p.created_at), 'd MMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {p.role !== 'admin' && (
                  <div className="flex gap-2 mt-3">
                    {p.statut !== 'actif' && (
                      <button onClick={() => setStatut(p.id, 'actif')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs">
                        <CheckCircle2 size={15} /> Activer
                      </button>
                    )}
                    {p.statut !== 'en_attente' && (
                      <button onClick={() => setStatut(p.id, 'en_attente')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-50 text-amber-700 rounded-xl font-bold text-xs">
                        <Clock size={15} /> Mettre en attente
                      </button>
                    )}
                    {p.statut !== 'suspendu' && (
                      <button onClick={() => setStatut(p.id, 'suspendu')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold text-xs">
                        <XCircle size={15} /> Suspendre
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
