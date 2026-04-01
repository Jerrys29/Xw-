import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Building2, Users, Home, UserCircle, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'

const agenceTabs = [
  { to: '/',              icon: LayoutDashboard, label: 'Accueil'    },
  { to: '/proprietaires', icon: Users,           label: 'Proprio'   },
  { to: '/maisons',       icon: Building2,       label: 'Maisons'   },
  { to: '/locataires',    icon: Home,            label: 'Locataires'},
  { to: '/profil',        icon: UserCircle,      label: 'Profil'    },
]

const locataireTabs = [
  { to: '/',       icon: Home,        label: 'Accueil' },
  { to: '/profil', icon: UserCircle,  label: 'Profil'  },
]

export default function BottomNav({ role, isAdmin }) {
  const [pendingCount, setPendingCount] = useState(0)
  const isLocataire = role === 'locataire'
  const tabs = isLocataire ? locataireTabs : agenceTabs

  useEffect(() => {
    if (!isAdmin) return
    supabase.from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('demande_activation', true)
      .neq('statut', 'actif')
      .then(({ count }) => setPendingCount(count ?? 0))

    const channel = supabase
      .channel('admin-demandes-mobile')
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg">
      <div className="flex max-w-lg mx-auto">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
                isActive ? 'text-blue-600' : 'text-slate-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl ${isActive ? 'bg-blue-50' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className="text-[10px] font-semibold leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Onglet Admin (agence uniquement) */}
        {isAdmin && !isLocataire && (
          <NavLink to="/admin"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
                isActive ? 'text-blue-600' : 'text-slate-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`relative p-1.5 rounded-xl ${isActive ? 'bg-blue-50' : ''}`}>
                  <ShieldCheck size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold leading-none">Admin</span>
              </>
            )}
          </NavLink>
        )}
      </div>
    </nav>
  )
}
