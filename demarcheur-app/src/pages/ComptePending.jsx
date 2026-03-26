import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Clock, LogOut, Bell, CheckCircle2, XCircle } from 'lucide-react'

export default function ComptePending({ statut }) {
  const user         = useAuthStore(s => s.user)
  const profile      = useAuthStore(s => s.profile)
  const refreshProfile = useAuthStore(s => s.refreshProfile)
  const signOut      = useAuthStore(s => s.signOut)
  const navigate     = useNavigate()

  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState(profile?.demande_activation ?? false)

  const isSuspended = statut === 'suspendu'

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  async function demanderActivation() {
    if (sent || sending) return
    setSending(true)

    const nom = user?.user_metadata?.nom ?? user?.email ?? 'Un démarcheur'

    await supabase.from('profiles').update({
      demande_activation: true,
      demande_at: new Date().toISOString(),
    }).eq('id', user.id)

    // Envoie une notification push à l'admin
    supabase.functions.invoke('send-push', {
      body: {
        title: '🔔 Nouvelle demande d\'activation',
        body:  `${nom} demande l'accès à l'application.`,
        url:   '/admin',
      }
    }).catch(() => {}) // silencieux si pas encore déployée

    await refreshProfile()
    setSent(true)
    setSending(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center">

        {/* Icône */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${
          isSuspended ? 'bg-red-100' : 'bg-amber-100'
        }`}>
          {isSuspended
            ? <XCircle size={36} className="text-red-500" />
            : <Clock size={36} className="text-amber-500" />
          }
        </div>

        {/* Titre */}
        <h1 className="text-xl font-bold text-slate-900 mb-3">
          {isSuspended ? 'Compte suspendu' : 'Compte en attente'}
        </h1>

        {/* Message */}
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          {isSuspended
            ? 'Votre compte a été suspendu. Contactez l\'administrateur pour plus d\'informations.'
            : 'Votre inscription a été reçue. Un administrateur doit activer votre compte avant que vous puissiez accéder à l\'application.'
          }
        </p>

        {/* Bouton demande d'activation — seulement si en_attente */}
        {!isSuspended && (
          sent ? (
            <div className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-50 text-emerald-700 rounded-2xl font-bold text-sm mb-3 border border-emerald-200">
              <CheckCircle2 size={18} /> Demande envoyée — en attente de validation
            </div>
          ) : (
            <button
              onClick={demanderActivation}
              disabled={sending}
              className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 disabled:bg-blue-300 text-white rounded-2xl font-bold text-base mb-3 active:bg-blue-700"
            >
              <Bell size={18} />
              {sending ? 'Envoi en cours…' : 'Demander l\'activation de mon compte'}
            </button>
          )
        )}

        {/* Déconnexion */}
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 text-slate-600 rounded-2xl font-semibold text-sm"
        >
          <LogOut size={16} /> Se déconnecter
        </button>
      </div>
    </div>
  )
}
