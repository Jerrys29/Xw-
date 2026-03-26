import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Building2, Users, Home, Building, UserCircle, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

const tabs = [
  { to: '/',              icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/proprietaires', icon: Users,           label: 'Propriétaires' },
  { to: '/maisons',       icon: Building2,       label: 'Maisons' },
  { to: '/locataires',    icon: Home,            label: 'Locataires' },
]

export default function Sidebar({ isAdmin }) {
  const user    = useAuthStore(s => s.user)
  const navigate = useNavigate()
  const [pendingCount, setPendingCount] = useState(0)

  const nom      = user?.user_metadata?.nom ?? user?.email ?? 'Mon compte'
  const initiales = nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    if (!isAdmin) return
    // Charge le nombre de demandes en attente
    supabase.from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('demande_activation', true)
      .neq('statut', 'actif')
      .then(({ count }) => setPendingCount(count ?? 0))

    // Écoute les nouvelles demandes en temps réel
    const channel = supabase
      .channel('admin-demandes')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'profiles',
        filter: 'demande_activation=eq.true',
      }, () => {
        supabase.from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('demande_activation', true)
          .neq('statut', 'actif')
          .then(({ count }) => setPendingCount(count ?? 0))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [isAdmin])

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-tight">Gestion immobilière</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <ShieldCheck size={19} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="flex-1">Administration</span>
                {pendingCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {pendingCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-100">
        <button
          onClick={() => navigate('/profil')}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">{initiales}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{nom}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <UserCircle size={16} className="text-slate-300 flex-shrink-0" />
        </button>
      </div>
    </aside>
  )
}
