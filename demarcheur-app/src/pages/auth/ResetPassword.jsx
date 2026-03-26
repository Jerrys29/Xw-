import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Lock, Eye, EyeOff, Building2, CheckCircle2, XCircle } from 'lucide-react'

const BG = { background: 'linear-gradient(135deg,#0a1628 0%,#0d2347 50%,#0a1628 100%)' }

export default function ResetPassword() {
  const navigate = useNavigate()
  const [status,   setStatus]   = useState('loading') // loading | ready | success | error | invalid
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    // Supabase traite le hash automatiquement via onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStatus('ready')
      }
    })

    // Vérifier si on a déjà une session recovery active
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setStatus('ready')
      } else {
        // Attendre 3s que Supabase parse le hash
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: d2 }) => {
            if (!d2.session) setStatus('invalid')
          })
        }, 3000)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError('Erreur lors de la mise à jour. Réessayez.')
    } else {
      setStatus('success')
      setTimeout(() => navigate('/login'), 3000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={BG}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Gestion immobilière</h1>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl">

          {/* Chargement */}
          {status === 'loading' && (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500 text-sm">Vérification du lien…</p>
            </div>
          )}

          {/* Lien invalide */}
          {status === 'invalid' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle size={36} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Lien expiré</h2>
              <p className="text-slate-500 text-sm mb-6">
                Ce lien de réinitialisation est invalide ou a expiré. Faites une nouvelle demande.
              </p>
              <button onClick={() => navigate('/forgot-password')}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl">
                Nouvelle demande
              </button>
            </div>
          )}

          {/* Formulaire */}
          {status === 'ready' && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Nouveau mot de passe</h2>
              <p className="text-slate-500 text-sm mb-5">
                Choisissez un nouveau mot de passe sécurisé.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={submit} className="space-y-4">
                {/* Nouveau mot de passe */}
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 6 caractères"
                      required
                      className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-10 py-3 text-base outline-none"
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirmer */}
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={`w-full bg-slate-50 border-2 rounded-xl pl-10 pr-4 py-3 text-base outline-none ${
                        confirm && confirm !== password
                          ? 'border-red-400'
                          : confirm && confirm === password
                          ? 'border-emerald-400'
                          : 'border-slate-200 focus:border-blue-500'
                      }`}
                    />
                  </div>
                  {confirm && confirm !== password && (
                    <p className="text-red-500 text-xs mt-1">Les mots de passe ne correspondent pas</p>
                  )}
                </div>

                {/* Indicateur de force */}
                {password && (
                  <div className="flex gap-1">
                    {[1,2,3].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${
                        password.length >= i * 4
                          ? i === 1 ? 'bg-red-400' : i === 2 ? 'bg-amber-400' : 'bg-emerald-500'
                          : 'bg-slate-200'
                      }`} />
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !password || !confirm || password !== confirm}
                  className="w-full py-4 bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-base font-bold rounded-xl mt-2"
                >
                  {loading ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
                </button>
              </form>
            </>
          )}

          {/* Succès */}
          {status === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={36} className="text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Mot de passe mis à jour !</h2>
              <p className="text-slate-500 text-sm mb-4">
                Votre mot de passe a été changé avec succès. Redirection vers la connexion…
              </p>
              <div className="flex gap-1 justify-center">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
