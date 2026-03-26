import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import PageHeader from '../components/PageHeader'

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

  useEffect(() => {
    supabase.from('proprietaires').select('id,nom').order('nom').then(({ data }) => setProprios(data ?? []))
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
      const { error } = await supabase.from('maisons').update(payload).eq('id', id)
      if (error) { setError('Erreur.'); setLoading(false); return }
      navigate(`/maisons/${id}`)
    } else {
      const { data, error } = await supabase.from('maisons').insert({ ...payload, latitude: null, longitude: null }).select().single()
      if (error) { setError('Erreur.'); setLoading(false); return }
      navigate(`/maisons/${data.id}`)
    }
  }

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
          <p className="text-xs text-slate-400 bg-blue-50 rounded-xl px-4 py-3">📍 La localisation GPS s'enregistre depuis la fiche de la maison, quand vous êtes sur place.</p>
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
