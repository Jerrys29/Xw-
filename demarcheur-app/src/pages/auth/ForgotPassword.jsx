import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Mail, Building2, ArrowLeft } from 'lucide-react'

export default function ForgotPassword() {
  const resetPassword = useAuthStore(s => s.resetPassword)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await resetPassword(email)
    setLoading(false)
    if (error) setError('Une erreur est survenue. Vérifiez l\u2019email.')
    else setSent(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white leading-tight">Gestion immobilière</h1>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Email envoyé !</h2>
              <p className="text-slate-500 text-sm mb-6">
                Vérifiez votre boîte mail <strong>{email}</strong>. Cliquez sur le lien pour réinitialiser votre mot de passe.
              </p>
              <Link to="/login" className="block w-full py-4 bg-blue-600 text-white font-bold rounded-xl text-center">
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <Link to="/login" className="flex items-center gap-1.5 text-slate-400 text-sm mb-5 hover:text-slate-600">
                <ArrowLeft size={16} /> Retour
              </Link>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Mot de passe oublié</h2>
              <p className="text-slate-500 text-sm mb-5">
                Entrez votre email. Nous vous enverrons un lien pour créer un nouveau mot de passe.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
              )}

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5">Email</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Mail size={18} /></div>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" required
                      className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 text-base outline-none"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading || !email}
                  className="w-full py-4 bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-base font-bold rounded-xl">
                  {loading ? 'Envoi…' : 'Envoyer le lien'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
