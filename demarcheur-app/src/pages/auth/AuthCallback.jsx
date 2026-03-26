import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Building2, CheckCircle2, XCircle } from 'lucide-react'

export default function AuthCallback() {
  const navigate     = useNavigate()
  const refreshProfile = useAuthStore(s => s.refreshProfile)
  const [status, setStatus] = useState('loading') // loading | success | error

  useEffect(() => {
    async function handleCallback() {
      try {
        // Supabase traite automatiquement le hash ou le token dans l'URL
        const { data, error } = await supabase.auth.getSession()

        if (error || !data.session) {
          // Essayer de récupérer le token dans le hash URL
          const hash = window.location.hash
          if (hash.includes('access_token')) {
            // Laisser Supabase parser le hash
            await new Promise(resolve => setTimeout(resolve, 1000))
            const { data: d2 } = await supabase.auth.getSession()
            if (d2.session) {
              await refreshProfile()
              setStatus('success')
              setTimeout(() => navigate('/'), 2000)
              return
            }
          }
          setStatus('error')
          return
        }

        await refreshProfile()
        setStatus('success')
        setTimeout(() => navigate('/'), 2000)
      } catch {
        setStatus('error')
      }
    }

    handleCallback()
  }, [])

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg,#0a1628 0%,#0d2347 50%,#0a1628 100%)' }}
    >
      <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm w-full">

        {status === 'loading' && (
          <>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(10,22,40,0.08)' }}>
              <Building2 size={32} className="text-blue-600" />
            </div>
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-900 mb-2">Vérification en cours…</h2>
            <p className="text-slate-500 text-sm">Confirmation de votre adresse email</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} className="text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Email confirmé !</h2>
            <p className="text-slate-500 text-sm mb-4">
              Votre email a été vérifié. Vous allez être redirigé vers l&apos;application.
            </p>
            <div className="flex gap-1 justify-center">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={36} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Lien invalide</h2>
            <p className="text-slate-500 text-sm mb-6">
              Ce lien de confirmation a expiré ou est invalide. Réessayez de vous connecter.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl"
            >
              Retour à la connexion
            </button>
          </>
        )}

      </div>
    </div>
  )
}
