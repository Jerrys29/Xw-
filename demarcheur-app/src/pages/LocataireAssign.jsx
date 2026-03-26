import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { offlineInsert, offlineUpdate } from '../lib/offlineSave'
import { useAuthStore } from '../store/authStore'
import PageHeader from '../components/PageHeader'
import { UserPlus, WifiOff } from 'lucide-react'

export default function LocataireAssign() {
  const { maisonId, menageId } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const [nom, setNom]             = useState('')
  const [tel, setTel]             = useState('')
  const [dateEntree, setDateEntree] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading]     = useState(false)
  const [savedOffline, setSavedOffline] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    const { offline } = await offlineInsert('locataires', {
      menage_id:   menageId,
      maison_id:   maisonId,
      user_id:     user.id,
      nom:         nom.trim() || 'Locataire inconnu',
      telephone:   tel.trim() || '',
      date_entree: dateEntree || null,
    }, 'locataires')
    await offlineUpdate('menages', menageId, { statut: 'occupé' }, `menages_${maisonId}`)
    if (offline) { setSavedOffline(true); setTimeout(() => navigate(`/maisons/${maisonId}`), 1500); return }
    navigate(`/maisons/${maisonId}/menages/${menageId}`)
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
      <PageHeader title="Assigner un locataire" back />
      <form onSubmit={submit} className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full space-y-4">

        <div className="bg-blue-50 rounded-2xl px-4 py-3 flex items-start gap-2">
          <UserPlus size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            Renseignez ce que vous savez sur le locataire. Aucun champ n&apos;est obligatoire.
          </p>
        </div>

        <Field
          label="Nom complet"
          value={nom}
          onChange={e => setNom(e.target.value)}
          placeholder="Ex: Kouassi Aimé  (optionnel)"
        />
        <Field
          label="Téléphone"
          value={tel}
          onChange={e => setTel(e.target.value)}
          placeholder="+229 97 00 00 00  (optionnel)"
          type="tel"
        />

        <div>
          <label className="block text-sm font-bold text-slate-600 mb-2">
            {"Date d'entrée"}  <span className="font-normal text-slate-400">(optionnel)</span>
          </label>
          <input
            type="date"
            value={dateEntree}
            onChange={e => setDateEntree(e.target.value)}
            className="w-full bg-white border-2 border-slate-200 focus:border-blue-500 rounded-2xl px-4 py-4 text-base outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-blue-600 disabled:bg-slate-300 disabled:text-slate-500 text-white text-lg font-bold rounded-2xl mt-4"
        >
          {loading ? 'Enregistrement…' : "Marquer comme occupé"}
        </button>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-600 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-white border-2 border-slate-200 focus:border-blue-500 rounded-2xl px-4 py-4 text-base outline-none"
      />
    </div>
  )
}
