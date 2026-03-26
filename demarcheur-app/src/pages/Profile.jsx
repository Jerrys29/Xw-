import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import PageHeader from '../components/PageHeader'
import { User, Phone, Mail, LogOut, Save, CheckCircle2 } from 'lucide-react'

export default function Profile() {
  const navigate  = useNavigate()
  const user           = useAuthStore(s => s.user)
  const refreshProfile = useAuthStore(s => s.refreshProfile)
  const signOut        = useAuthStore(s => s.signOut)

  const [nom, setNom]         = useState(user?.user_metadata?.nom       ?? '')
  const [telephone, setTel]   = useState(user?.user_metadata?.telephone  ?? '')
  const [loading,        setLoading]        = useState(false)
  const [loadingSignOut, setLoadingSignOut] = useState(false)
  const [saved,          setSaved]          = useState(false)
  const [error,          setError]          = useState('')

  async function save(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const nomTrim = nom.trim()
      const telTrim = telephone.trim()

      // Timeout de sécurité 8s
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 8000)
      )

      // Mettre à jour auth metadata ET la table profiles en parallèle
      await Promise.race([
        Promise.all([
          supabase.auth.updateUser({ data: { nom: nomTrim, telephone: telTrim } }),
          supabase.from('profiles').update({ nom: nomTrim, telephone: telTrim }).eq('id', user.id),
        ]),
        timeout,
      ])

      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message === 'timeout'
        ? 'La connexion est lente. Réessayez.'
        : 'Erreur lors de la mise à jour.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    setLoadingSignOut(true)
    try {
      await signOut()
    } catch (_) {
      // ignorer les erreurs
    } finally {
      // Forcer un rechargement complet pour vider tous les états
      window.location.href = '/login'
    }
  }

  const initiales = nom ? nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader title="Mon profil" back />
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full space-y-5">

        {/* Avatar */}
        <div className="flex flex-col items-center pb-2">
          <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center mb-3">
            <span className="text-white font-bold text-2xl">{initiales}</span>
          </div>
          <p className="text-base font-bold text-slate-900">{nom || 'Mon compte'}</p>
          <p className="text-sm text-slate-400">{user?.email}</p>
        </div>

        {error  && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
        {saved  && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <CheckCircle2 size={16} /> Profil mis à jour !
          </div>
        )}

        <form onSubmit={save} className="space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Nom complet</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Votre nom"
                className="w-full bg-white border-2 border-slate-200 focus:border-blue-500 rounded-2xl pl-11 pr-4 py-4 text-base outline-none" />
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Téléphone</label>
            <div className="relative">
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="tel" value={telephone} onChange={e => setTel(e.target.value)} placeholder="+229 97 00 00 00"
                className="w-full bg-white border-2 border-slate-200 focus:border-blue-500 rounded-2xl pl-11 pr-4 py-4 text-base outline-none" />
            </div>
          </div>

          {/* Email (lecture seule) */}
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={user?.email ?? ''} readOnly
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-11 pr-4 py-4 text-base text-slate-400 outline-none cursor-not-allowed" />
            </div>
            <p className="text-xs text-slate-400 mt-1 ml-1">L&apos;email ne peut pas être modifié</p>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-base font-bold rounded-2xl">
            <Save size={18} /> {loading ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        </form>

        {/* Déconnexion */}
        <div className="pt-2">
          <button onClick={handleSignOut} disabled={loadingSignOut}
            className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 disabled:opacity-60 text-red-600 text-base font-bold rounded-2xl border border-red-100">
            {loadingSignOut
              ? <><div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" /> Déconnexion…</>
              : <><LogOut size={18} /> Se déconnecter</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
