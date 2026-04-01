import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { offlineInsert, offlineUpdate } from '../lib/offlineSave'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import PageHeader from '../components/PageHeader'
import { UserPlus, WifiOff, Copy, CheckCircle2, ShieldCheck } from 'lucide-react'

function genPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function LocataireAssign() {
  const { maisonId, menageId } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)

  const [nom,        setNom]        = useState('')
  const [tel,        setTel]        = useState('')
  const [dateEntree, setDateEntree] = useState(new Date().toISOString().split('T')[0])
  const [creerCompte, setCreerCompte] = useState(false)

  const [loading,      setLoading]      = useState(false)
  const [savedOffline, setSavedOffline] = useState(false)
  const [error,        setError]        = useState('')

  // Résultat création compte
  const [compteCreé, setCompteCreé] = useState(null) // { telephone, password }
  const [copied,     setCopied]     = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const telephone = tel.trim()
    const nomFinal  = nom.trim() || 'Locataire inconnu'

    try {
      let profileId = null

      /* ── Création du compte locataire si demandé ── */
      if (creerCompte && telephone) {
        if (!supabaseAdmin) {
          setError('Clé service Supabase manquante. Ajoutez VITE_SUPABASE_SERVICE_KEY dans .env')
          setLoading(false)
          return
        }

        const phoneClean = telephone.replace(/[^0-9]/g, '')
        const email      = `loc.${phoneClean}@demarcheur.app`
        const password   = genPassword()

        // 1. Créer l'utilisateur via admin
        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { nom: nomFinal, telephone },
        })

        if (authErr) {
          // Peut-être que l'utilisateur existe déjà
          if (!authErr.message.includes('already')) {
            setError(`Erreur création compte : ${authErr.message}`)
            setLoading(false)
            return
          }
          // Si déjà existant, on récupère le profil existant
          const { data: existPro } = await supabase
            .from('profiles')
            .select('id')
            .eq('telephone', telephone)
            .maybeSingle()
          profileId = existPro?.id ?? null
        } else {
          profileId = authData.user.id
          // 2. Mettre à jour le profil avec role + statut + nom + telephone
          await supabase.from('profiles').upsert({
            id:        profileId,
            nom:       nomFinal,
            telephone,
            role:      'locataire',
            statut:    'actif',
          })
          setCompteCreé({ telephone, password })
        }
      }

      /* ── Enregistrement locataire + ménage ── */
      const locataireData = {
        menage_id:   menageId,
        maison_id:   maisonId,
        user_id:     user.id,
        nom:         nomFinal,
        telephone:   telephone || '',
        date_entree: dateEntree || null,
      }
      if (profileId) locataireData.profile_id = profileId

      const { offline } = await offlineInsert('locataires', locataireData, 'locataires')
      await offlineUpdate('menages', menageId, { statut: 'occupé' }, `menages_${maisonId}`)

      if (offline) {
        setSavedOffline(true)
        setTimeout(() => navigate(`/maisons/${maisonId}`), 2000)
        return
      }

      // Si compte créé → rester sur la page pour afficher le mot de passe
      if (!compteCreé && !profileId) {
        navigate(`/maisons/${maisonId}/menages/${menageId}`)
      }
    } catch (err) {
      setError(err.message ?? 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  function copier(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  /* ── Compte créé avec succès ── */
  if (compteCreé) return (
    <div className="flex-1 flex flex-col">
      <PageHeader title="Compte créé !" back={false} />
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full space-y-4">

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 size={28} className="text-emerald-600" />
          </div>
          <p className="font-bold text-emerald-800 text-lg">Accès locataire créé</p>
          <p className="text-sm text-emerald-700">
            Communiquez ces identifiants au locataire pour qu&apos;il puisse se connecter.
          </p>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Téléphone (identifiant)</p>
            <p className="font-bold text-slate-900 text-lg">{compteCreé.telephone}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Mot de passe</p>
            <div className="flex items-center gap-2">
              <p className="font-mono font-bold text-slate-900 text-xl tracking-wider flex-1">{compteCreé.password}</p>
              <button onClick={() => copier(compteCreé.password)}
                className={`p-2 rounded-xl transition-colors ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center px-4">
          ⚠ Ce mot de passe ne sera plus affiché. Notez-le ou copiez-le maintenant.
        </p>

        <button
          onClick={() => navigate(`/maisons/${maisonId}/menages/${menageId}`)}
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl"
        >
          Continuer →
        </button>
      </div>
    </div>
  )

  /* ── Sauvegarde hors ligne ── */
  if (savedOffline) return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
        <WifiOff size={28} className="text-amber-500" />
      </div>
      <p className="font-bold text-slate-800 text-lg">Enregistré hors ligne</p>
      <p className="text-slate-500 text-sm">Sera synchronisé dès le retour de la connexion.</p>
    </div>
  )

  /* ── Formulaire ── */
  return (
    <div className="flex-1 flex flex-col">
      <PageHeader title="Assigner un locataire" back />
      <form onSubmit={submit} className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full space-y-4">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        <div className="bg-blue-50 rounded-2xl px-4 py-3 flex items-start gap-2">
          <UserPlus size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            Renseignez ce que vous savez sur le locataire. Aucun champ n&apos;est obligatoire.
          </p>
        </div>

        <Field label="Nom complet" value={nom} onChange={e => setNom(e.target.value)}
          placeholder="Ex : Kouassi Aimé  (optionnel)" />

        <Field label="Téléphone" value={tel} onChange={e => setTel(e.target.value)}
          placeholder="+229 97 00 00 00  (optionnel)" type="tel" />

        <div>
          <label className="block text-sm font-bold text-slate-600 mb-2">
            {"Date d'entrée"} <span className="font-normal text-slate-400">(optionnel)</span>
          </label>
          <input type="date" value={dateEntree} onChange={e => setDateEntree(e.target.value)}
            className="w-full bg-white border-2 border-slate-200 focus:border-blue-500 rounded-2xl px-4 py-4 text-base outline-none" />
        </div>

        {/* Option : créer un accès locataire */}
        {tel.trim().length >= 8 && (
          <button type="button"
            onClick={() => setCreerCompte(v => !v)}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl border-2 text-left transition-colors ${
              creerCompte ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${creerCompte ? 'bg-blue-100' : 'bg-slate-100'}`}>
              <ShieldCheck size={18} className={creerCompte ? 'text-blue-600' : 'text-slate-400'} />
            </div>
            <div>
              <p className={`font-bold text-sm ${creerCompte ? 'text-blue-700' : 'text-slate-700'}`}>
                Créer un accès locataire
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Le locataire pourra se connecter avec son téléphone
              </p>
            </div>
            <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${creerCompte ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
              {creerCompte && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
          </button>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-5 bg-blue-600 disabled:bg-slate-300 disabled:text-slate-500 text-white text-lg font-bold rounded-2xl mt-2">
          {loading ? 'Enregistrement…' : 'Marquer comme occupé'}
        </button>
      </form>
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
