import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { offlineInsert, offlineUpdate } from '../lib/offlineSave'
import { cache } from '../lib/cache'
import { useAuthStore } from '../store/authStore'
import PageHeader from '../components/PageHeader'
import { WifiOff } from 'lucide-react'

export default function MaisonForm() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const isEdit = Boolean(id)
  const [form, setForm] = useState({ nom: '', ville: 'Cotonou', quartier: '', proprietaireId: searchParams.get('proprietaireId') || '' })
  const [proprios, setProprios] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedOffline, setSavedOffline] = useState(false)

  useEffect(() => {
    // Propriétaires : depuis cache si offline
    if (!navigator.onLine) {
      setProprios(cache.get('proprietaires') ?? [])
    } else {
      supabase.from('proprietaires').select('id,nom').order('nom').then(({ data }) => setProprios(data ?? []))
    }
    if (isEdit) supabase.from('maisons').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setForm({ nom: data.nom, ville: data.ville, quartier: data.quartier, proprietaireId: data.proprietaire_id ?? '' })
    })
  }, [id])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!form.nom.trim() || !form.quartier.trim()) return
    setLoading(true)
    const payload = { nom: form.nom.trim(), ville: form.ville.trim(), quartier: form.quartier.trim(), proprietaire_id: form.proprietaireId || null, user_id: user.id }

    if (isEdit) {
      const { error, offline } = await offlineUpdate('maisons', id, payload, 'maisons')
      if (error) { setError('Erreur.'); setLoading(false); return }
      if (offline) { setSavedOffline(true); setTimeout(() => navigate('/maisons'), 1500); return }
      navigate(`/maisons/${id}`)
    } else {
      const { data, error, offline } = await offlineInsert('maisons', { ...payload, latitude: null, longitude: null }, 'maisons')
      if (error) { setError('Erreur.'); setLoading(false); return }
      if (offline) { setSavedOffline(true); setTimeout(() => navigate('/maisons'), 1500); return }
      navigate(`/maisons/${data.id}`)
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
      <PageHeader title={isEdit ? 'Modifier la maison' : 'Nouvelle maison'} back />
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Propriétaire</label>
            <select value={form.proprietaireId} onChange={set('proprietaireId')} className="w-full bg-white border-2 border-slate-200 focus:border-blue-500 rounded-2xl px-4 py-4 text-base outline-none">
              <option value="">— Choisir un propriétaire —</option>
              {proprios.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>
          <Field label="Nom de la maison" value={form.nom} onChange={set('nom')} placeholder="Ex: Maison Fidjrossè" />
          <Field label="Quartier" value={form.quartier} onChange={set('quartier')} placeholder="Ex: Fidjrossè" />
          <Field label="Ville" value={form.ville} onChange={set('ville')} placeholder="Ex: Cotonou" />
          <p className="text-xs text-slate-400 bg-blue-50 rounded-xl px-4 py-3">📍 La localisation GPS s&apos;enregistre depuis la fiche de la maison, quand vous êtes sur place.</p>
          <button type="submit" disabled={loading || !form.nom.trim() || !form.quartier.trim()}
            className="w-full py-5 bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-lg font-bold rounded-2xl">
            {loading ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter la maison'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-600 mb-2">{label}</label>
      <input value={value} onChange={onChange} placeholder={placeholder}
        className="w-full bg-white border-2 border-slate-200 focus:border-blue-500 rounded-2xl px-4 py-4 text-base outline-none" />
    </div>
  )
}
