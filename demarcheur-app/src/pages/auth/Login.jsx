import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Mail, Lock, Eye, EyeOff, Building2 } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const signIn = useAuthStore(s => s.signIn)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn({ email, password })
    setLoading(false)
    if (error) {
      setError('Email ou mot de passe incorrect.')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:'linear-gradient(135deg,#0a1628 0%,#0d2347 50%,#0a1628 100%)'}}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{background:'rgba(255,255,255,0.15)'}}>
            <Building2 size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight">Gestion immobilière</h1>
          <p className="text-blue-200 mt-1 text-sm">Gérez vos biens facilement</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Connexion</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <AuthField
              label="Email" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com" icon={<Mail size={18} />}
            />
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1.5">Mot de passe</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={18} /></div>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-10 py-3 text-base outline-none transition-colors"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-blue-600 font-semibold">
                Mot de passe oublié ?
              </Link>
            </div>

            <button type="submit" disabled={loading || !email || !password}
              className="w-full py-4 bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-base font-bold rounded-xl active:bg-blue-700 transition-colors mt-2">
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-blue-600 font-bold">S&apos;inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function AuthField({ label, type, value, onChange, placeholder, icon }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-600 mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} required
          className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 text-base outline-none transition-colors"
        />
      </div>
    </div>
  )
}
