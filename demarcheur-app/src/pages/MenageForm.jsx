import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { offlineInsert, offlineUpdate } from '../lib/offlineSave'
import { useAuthStore } from '../store/authStore'
import PageHeader from '../components/PageHeader'
import { WifiOff } from 'lucide-react'

const TYPES = ['Chambre', 'Studio', 'Appartement', 'Villa', 'Boutique']

export default function MenageForm() {
  const { maisonId, menageId } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const isEdit = Boolean(menageId)
  const [form, setForm] = useState({ numero: '', type: 'Chambre', statut: 'libre', loyer: '', compteurElec: '', compteurEau: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [savedOffline, setSavedOffline] = useState(false)

  useEffect(() => {
    if (isEdit) supabase.from('menages').select('*').eq('id', menageId).single().then(({ data }) => {
      if (data) setForm({
        numero: data.numero, type: data.type, statut: data.statut,
        loyer: data.loyer ?? '', compteurElec: data.compteur_elec ?? '', compteurEau: data.compteur_eau ?? '', notes: data.notes ?? ''
      })
    })
  }, [menageId])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!form.numero.trim()) return
    setLoading(true)
    const payload = {
      maison_id: maisonId, user_id: user.id,
      numero: form.numero.trim(), type: form.type, statut: form.statut,
      loyer: form.loyer !== '' ? Number(form.loyer) : null,
      compteur_elec: form.compteurElec !== '' ? Number(form.compteurElec) : null,
      compteur_eau: form.compteurEau !== '' ? Number(form.compteurEau) : null,
      notes: form.notes,
    }
    if (isEdit) {
      const { offline } = await offlineUpdate('menages', menageId, payload, `menages_${maisonId}`)
      if (offline) { setSavedOffline(true); setTimeout(() => navigate(`/maisons/${maisonId}`), 1500); return }
      navigate(`/maisons/${maisonId}/menages/${menageId}`)
    } else {
      const { data, offline } = await offlineInsert('menages', payload, `menages_${maisonId}`)
      if (offline) { setSavedOffline(true); setTimeout(() => navigate(`/maisons/${maisonId}`), 1500); return }
      navigate(`/maisons/${maisonId}/menages/${data.id}`)
    }
  }

  if (savedOffline) return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
        <WifiOff size={28} className="text-amber-500" />
      </div>
      <p className="font-bold text-slate-800 text-lg">Enregistré hors ligne</p>
      <p className="text-slate-500 text-sm">Sera synchronisé automatiquement dès le retour de la connexion.</p>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader title={isEdit ? 'Modifier le ménage' : 'Nouveau ménage'} back />
      <form onSubmit={submit} className="flex-1 overflow-y-auto px-4 py-6 pb-20 max-w-lg mx-auto w-full space-y-5">
        <Field label="Nom ou numéro *" value={form.numero} onChange={set('numero')} placeholder="Chambre 1, Studio A…" />

        <div>
          <label className="block text-sm font-bold text-slate-600 mb-2">Type de logement</label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map(t => (
              <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${form.type === t ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-600 mb-2">Statut</label>
          <div className="flex gap-3">
            {[['libre','Libre','bg-blue-600'],['occupé','Occupé','bg-emerald-600']].map(([v,l,c]) => (
              <button key={v} type="button" onClick={() => setForm(f => ({ ...f, statut: v }))}
                className={`flex-1 py-4 rounded-2xl text-base font-bold transition-colors ${form.statut === v ? `${c} text-white` : 'bg-white text-slate-500 border-2 border-slate-200'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <Field label="Loyer mensuel (F CFA)" value={form.loyer} onChange={set('loyer')} placeholder="35000" type="number" />

        <div>
          <p className="text-sm font-bold text-slate-600 mb-3">Compteurs (optionnel)</p>
          <div className="space-y-3">
            <Field label="⚡ SBEE — électricité (kWh)" value={form.compteurElec} onChange={set('compteurElec')} placeholder="1250" type="number" />
            <Field label="💧 SONEB — eau (m³)" value={form.compteurEau} onChange={set('compteurEau')} placeholder="320" type="number" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-600 mb-2">Notes</label>
          <textarea value={form.notes} onChange={set('notes')} placeholder="Informations supplémentaires…" rows={3}
            className="w-full bg-white border-2 border-slate-200 focus:border-blue-500 rounded-2xl px-4 py-3 text-base outline-none resize-none" />
        </div>

        <button type="submit" disabled={loading || !form.numero.trim()}
          className="w-full py-5 bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-lg font-bold rounded-2xl">
          {loading ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter le ménage'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-600 mb-2">{label}</label>
      <input type={type} inputMode={type === 'number' ? 'numeric' : undefined} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full bg-white border-2 border-slate-200 focus:border-blue-500 rounded-2xl px-4 py-4 text-base outline-none" />
    </div>
  )
}
