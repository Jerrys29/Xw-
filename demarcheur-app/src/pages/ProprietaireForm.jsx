import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { offlineInsert, offlineUpdate } from '../lib/offlineSave'
import { useAuthStore } from '../store/authStore'
import PageHeader from '../components/PageHeader'
import { WifiOff } from 'lucide-react'

export default function ProprietaireForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const isEdit = Boolean(id)
  const [nom, setNom] = useState('')
  const [tel, setTel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedOffline, setSavedOffline] = useState(false)

  useEffect(() => {
    if (isEdit) supabase.from('proprietaires').select('*').eq('id', id).single().then(({ data }) => {
      if (data) { setNom(data.nom); setTel(data.telephone) }
    })
  }, [id])

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!nom.trim() || !tel.trim()) return
    setLoading(true)
    const payload = { nom: nom.trim(), telephone: tel.trim(), user_id: user.id }

    if (isEdit) {
      const { error, offline } = await offlineUpdate('proprietaires', id, payload, 'proprietaires')
      if (error) { setError('Erreur lors de la modification.'); setLoading(false); return }
      if (offline) { setSavedOffline(true); setTimeout(() => navigate(`/proprietaires`), 1500); return }
      navigate(`/proprietaires/${id}`)
    } else {
      const { data, error, offline } = await offlineInsert('proprietaires', payload, 'proprietaires')
      if (error) { setError('Erreur lors de la création.'); setLoading(false); return }
      if (offline) { setSavedOffline(true); setTimeout(() => navigate(`/proprietaires`), 1500); return }
      navigate(`/proprietaires/${data.id}`)
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
      <PageHeader title={isEdit ? 'Modifier' : 'Nouveau propriétaire'} back />
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nom complet" value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex: Monsieur Agbossou" />
          <Field label="Téléphone" value={tel} onChange={e => setTel(e.target.value)} placeholder="+229 97 00 00 00" type="tel" />
          <button type="submit" disabled={loading || !nom.trim() || !tel.trim()}
            className="w-full py-5 bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-lg font-bold rounded-2xl mt-4">
            {loading ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter le propriétaire'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-600 mb-2">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full bg-white border-2 border-slate-200 focus:border-blue-500 rounded-2xl px-4 py-4 text-base outline-none" />
    </div>
  )
}
