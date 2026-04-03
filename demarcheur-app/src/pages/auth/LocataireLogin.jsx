import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Phone, Lock, Eye, EyeOff, Home, ArrowLeft } from 'lucide-react'

export default function LocataireLogin() {
  const navigate         = useNavigate()
  const signInLocataire  = useAuthStore(s => s.signInLocataire)

  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const canSubmit = phone.length >= 8 && password.length >= 4

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signInLocataire({ phone, password })
    setLoading(false)
    if (err) {
      setError('Numéro ou mot de passe incorrect. Contactez votre agence.')
    } else {
      navigate('/')
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg,#0a2e1a 0%,#0d4728 50%,#0a2e1a 100%)' }}
    >
      <div className="w-full max-w-sm">

        {/* Logo / titre */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Home size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight">Espace Locataire</h1>
          <p className="text-green-200 mt-1 text-sm">Suivez vos paiements de loyer</p>
        </div>

        {/* Carte */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl">

          {/* Badge */}
          <div className="flex items-center justify-center mb-5">
            <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-100">
              <Home size={13} /> Connexion Locataire
            </span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1.5">
                Numéro de téléphone
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+229 97 00 00 00"
                  required
                  autoComplete="tel"
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-base outline-none transition-colors"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 rounded-xl pl-10 pr-10 py-3 text-base outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center">
              Identifiants fournis par votre agence.{' '}
              <br />Mot de passe oublié ? Contactez votre agence.
            </p>

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full py-4 bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-base font-bold rounded-xl active:bg-emerald-700 transition-colors"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
