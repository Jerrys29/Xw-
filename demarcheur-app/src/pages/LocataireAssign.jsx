import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { offlineInsert, offlineUpdate } from '../lib/offlineSave'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import { UserPlus, WifiOff, Copy, CheckCircle2, ShieldCheck, Share2, Key, RefreshCw } from 'lucide-react'

function genPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function LocataireAssign() {
  const { maisonId, menageId } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)

  const [nom, setNom] = useState('')
  const [tel, setTel] = useState('')
  const [loyer, setLoyer] = useState('')
  const [dateEntree, setDateEntree] = useState(new Date().toISOString().split('T')[0])
  const [creerCompte, setCreerCompte] = useState(true) // Actif par défaut comme demandé

  const [loading, setLoading] = useState(false)
  const [savedOffline, setSavedOffline] = useState(false)
  const [error, setError] = useState('')

  // Pré-remplir le loyer
  useEffect(() => {
    supabase.from('menages').select('loyer').eq('id', menageId).single().then(({ data }) => {
      if (data?.loyer) setLoyer(data.loyer)
    })
  }, [menageId])

  // Résultat création compte
  const [compteCreé, setCompteCreé] = useState(null) // { telephone, password }
  const [copied, setCopied] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const telephone = tel.trim()
    const nomFinal = nom.trim() || 'Locataire inconnu'
    const loyerFinal = Number(loyer) || 0

    try {
      let profileId = null
      let passwordGenerated = genPassword()

      /* ── Création du compte locataire via RPC ── */
      if (creerCompte && telephone) {
        const { data: newUserId, error: rpcErr } = await supabase.rpc('create_locataire_account', {
          p_phone: telephone,
          p_password: passwordGenerated,
          p_nom: nomFinal
        })

        if (rpcErr) throw rpcErr
        profileId = newUserId
        setCompteCreé({ telephone, password: passwordGenerated })
      }

      /* ── Enregistrement locataire + ménage ── */
      const locataireData = {
        menage_id: menageId,
        maison_id: maisonId,
        user_id: user.id,
        nom: nomFinal,
        telephone: telephone || '',
        date_entree: dateEntree || null,
        loyer: loyerFinal
      }
      if (profileId) locataireData.profile_id = profileId

      // On insère le locataire
      const { error: locErr } = await supabase.from('locataires').insert(locataireData)

      if (locErr) {
        const { offline } = await offlineInsert('locataires', locataireData, 'locataires')
        if (offline) {
          setSavedOffline(true)
          setTimeout(() => navigate(`/maisons/${maisonId}`), 2000)
          return
        }
        throw locErr
      }

      // On marque le ménage comme occupé et on met à jour le loyer
      await supabase.from('menages').update({ statut: 'occupé', loyer: loyerFinal }).eq('id', menageId)
      await offlineUpdate('menages', menageId, { statut: 'occupé', loyer: loyerFinal }, `menages_${maisonId}`)

      if (!compteCreé) {
        navigate(`/maisons/${maisonId}`)
      }
    } catch (err) {
      console.error(err)
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
  if (compteCreé) {
    const lienConnexion = `${window.location.origin}/locataire-login`

    const messagePartage =
      `🏠 Votre accès locataire

📱 Téléphone : ${compteCreé.telephone}
🔑 Mot de passe : ${compteCreé.password}

🔗 Connectez-vous ici :
${lienConnexion}

⚠️ Gardez ces informations en sécurité.`

    async function partager() {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Accès locataire',
            text: messagePartage,
          })
        } catch (_) { /* annulé par l'utilisateur */ }
      } else {
        copier(messagePartage)
      }
    }

    return (
      <div className="flex-1 flex flex-col">
        <PageHeader title="Compte créé !" back={false} />
        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full space-y-4">

          {/* Succès */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-black text-emerald-900 text-xl">Accès locataire actif</p>
              <p className="text-sm text-emerald-700 font-medium opacity-80 mt-1">
                Le compte est prêt. Partagez ces identifiants au locataire.
              </p>
            </div>
          </div>

          {/* Carte identifiants */}
          <div className="bg-white border-2 border-slate-100 rounded-3xl overflow-hidden shadow-xl shadow-slate-100">

            <div className="px-6 py-6 space-y-5">
              {/* Téléphone */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Identifiant (Téléphone)
                </p>
                <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-900 text-base">{compteCreé.telephone}</p>
                  <button
                    onClick={() => copier(compteCreé.telephone)}
                    className="p-2 rounded-lg bg-white shadow-sm text-slate-500 active:scale-90 transition-transform"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Mot de passe provisoire
                </p>
                <div className="flex items-center justify-between gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="font-mono font-black text-blue-900 text-2xl tracking-widest">
                    {compteCreé.password}
                  </p>
                  <button
                    onClick={() => copier(compteCreé.password)}
                    className={`p-2 rounded-lg shadow-sm transition-all active:scale-90 ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-blue-500'}`}
                  >
                    {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Lien de connexion */}
              <div className="pt-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Lien de l&apos;Espace Locataire
                </p>
                <div className="flex items-center justify-between gap-2 text-blue-600">
                  <p className="text-xs font-bold truncate flex-1 opacity-70 underline">
                    {lienConnexion}
                  </p>
                  <button
                    onClick={() => copier(lienConnexion)}
                    className="p-2 rounded-lg bg-slate-50 text-slate-500 flex-shrink-0 active:scale-90 transition-transform"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
            <Key size={20} className="text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-800 font-medium">
              Attention : ce mot de passe ne sera plus jamais affiché. Veuillez le copier ou le partager maintenant.
            </p>
          </div>

          <div className="pt-4 space-y-3">
            {/* Bouton Partager */}
            <button
              onClick={partager}
              className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-100 active:scale-95 transition-all"
            >
              <Share2 size={20} />
              {navigator.share ? 'Envoyer au locataire' : 'Copier le message'}
            </button>

            <button
              onClick={() => navigate(`/maisons/${maisonId}/menages/${menageId}`)}
              className="w-full py-4 text-slate-400 font-bold rounded-2xl active:opacity-60"
            >
              Terminer l&apos;assignation
            </button>
          </div>

        </div>
      </div>
    )
  }

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
      <form onSubmit={submit} className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full space-y-5 pb-28">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-5 py-4">{error}</div>
        )}

        <div className="bg-blue-50 rounded-3xl px-5 py-4 flex items-start gap-3 border border-blue-100">
          <UserPlus size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800 font-medium leading-relaxed">
            Configurez l&apos;occupation du logement. Le compte locataire est créé automatiquement s&apos;il a un téléphone.
          </p>
        </div>

        <Field label="Nom du locataire" value={nom} onChange={e => setNom(e.target.value)}
          placeholder="Ex : Jean Dupont" />

        <Field label="Numéro de téléphone" value={tel} onChange={e => setTel(e.target.value)}
          placeholder="+229 97 00 00 00" type="tel" />

        <div>
          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{"Date d'entrée"}</label>
          <input type="date" value={dateEntree} onChange={e => setDateEntree(e.target.value)}
            className="w-full bg-white border-2 border-slate-100 focus:border-blue-500 rounded-2xl px-5 py-4 text-base outline-none font-bold text-slate-800" />
        </div>

        {/* Option : créer un accès locataire (Toujours visible si tel rempli) */}
        {tel.trim().length >= 8 && (
          <div className="pt-2">
            <button type="button"
              onClick={() => setCreerCompte(v => !v)}
              className={`w-full flex items-center gap-4 px-5 py-5 rounded-3xl border-2 text-left transition-all ${creerCompte ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-50' : 'border-slate-100 bg-white'
                }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${creerCompte ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                <ShieldCheck size={24} />
              </div>
              <div className="flex-1">
                <p className={`font-black text-base ${creerCompte ? 'text-blue-900' : 'text-slate-700'}`}>
                  Accès Espace Locataire
                </p>
                <p className={`text-xs font-medium mt-0.5 ${creerCompte ? 'text-blue-600 opacity-70' : 'text-slate-400'}`}>
                  Compte actif immédiatement
                </p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${creerCompte ? 'border-blue-500 bg-blue-500' : 'border-slate-200'}`}>
                {creerCompte && <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />}
              </div>
            </button>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-5 bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white text-lg font-black rounded-3xl mt-4 shadow-xl shadow-slate-200 active:scale-95 transition-all">
          {loading ? (
            <div className="flex items-center justify-center gap-3">
              <RefreshCw size={20} className="animate-spin" />
              <span>Enregistrement…</span>
            </div>
          ) : 'Assigner le locataire'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full bg-white border-2 border-slate-100 focus:border-blue-500 rounded-2xl px-5 py-4 text-base outline-none font-bold text-slate-800" />
    </div>
  )
}
