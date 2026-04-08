import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Mail, Lock, Eye, EyeOff, User, Phone, Building2 } from 'lucide-react'

export default function Register() {
  const navigate = useNavigate()
  const signUp   = useAuthStore(s => s.signUp)
  const [form, setForm] = useState({ nom: '', telephone: '', email: '', password: '', confirm: '' })
  const [cgu, setCgu]   = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  // const [success, setSuccess] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!cgu) { setError('Vous devez accepter les conditions d\'utilisation.'); return }
    if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (form.password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères.'); return }
    setLoading(true)
    const { data, error } = await signUp({
      email: form.email, password: form.password,
      nom: form.nom, telephone: form.telephone,
      cgu_acceptees: true,
    })
    setLoading(false)
    if (error) {
      if (error.message.includes('already registered')) setError('Cet email est déjà utilisé.')
      else setError('Une erreur est survenue. Réessayez.')
    } else {
      // Inscription réussie → connexion automatique → dashboard direct
      navigate('/')
    }
  }

  /* — Confirmation email désactivée, on connecte directement —
  if (success) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:'linear-gradient(135deg,#0a1628 0%,#0d2347 50%,#0a1628 100%)'}}>
      <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm w-full">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Confirmez votre email</h2>
        <p className="text-slate-600 text-sm mb-6">
          Un lien de confirmation a été envoyé à <strong>{form.email}</strong>.
          Cliquez dessus pour accéder à votre espace.
        </p>
        <Link to="/login" className="block w-full py-4 bg-blue-600 text-white font-bold rounded-xl text-center">
          Retour à la connexion
        </Link>
      </div>
    </div>
  )
  */

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:'linear-gradient(135deg,#0a1628 0%,#0d2347 50%,#0a1628 100%)'}}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{background:'rgba(255,255,255,0.15)'}}>
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white leading-tight">Gestion immobilière</h1>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Créer un compte</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
          )}

          <form onSubmit={submit} className="space-y-3">
            <Field label="Votre nom" value={form.nom} onChange={set('nom')} placeholder="Ex: Kodjo Mensah" icon={<User size={18} />} />
            <Field label="Téléphone" value={form.telephone} onChange={set('telephone')} placeholder="+229 97 00 00 00" icon={<Phone size={18} />} type="tel" required={false} />
            <Field label="Email" value={form.email} onChange={set('email')} placeholder="votre@email.com" icon={<Mail size={18} />} type="email" />

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Min. 6 caractères" required
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-10 py-3 text-base outline-none" />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Field label="Confirmer le mot de passe" value={form.confirm} onChange={set('confirm')} placeholder="••••••••" icon={<Lock size={18} />} type="password" />

            {/* Case CGU — inclut la clause data (article 4) */}
            <label className="flex items-start gap-3 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={cgu}
                onChange={e => setCgu(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded accent-blue-600 flex-shrink-0 cursor-pointer"
              />
              <span className="text-xs text-slate-500 leading-relaxed">
                J&apos;accepte les{' '}
                <Link to="/cgu" target="_blank" className="text-blue-600 font-semibold underline">
                  conditions générales d&apos;utilisation
                </Link>
                {' '}et la{' '}
                <Link to="/cgu" target="_blank" className="text-blue-600 font-semibold underline">
                  politique de confidentialité
                </Link>.
              </span>
            </label>

            <button type="submit" disabled={loading || !form.email || !form.password || !cgu}
              className="w-full py-4 bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-base font-bold rounded-xl mt-1">
              {loading ? 'Envoi en cours…' : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-blue-600 font-bold">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, icon, type = 'text', required = true }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-600 mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
          className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 text-base outline-none" />
      </div>
    </div>
  )
}
