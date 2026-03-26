import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { usePushNotifications } from './hooks/usePushNotifications'

import Sidebar        from './components/Sidebar'
import BottomNav      from './components/BottomNav'
import OfflineBanner  from './components/OfflineBanner'

import Login          from './pages/auth/Login'
import Register       from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import AuthCallback   from './pages/auth/AuthCallback'
import ResetPassword  from './pages/auth/ResetPassword'
import ComptePending  from './pages/ComptePending'
import CGU            from './pages/CGU'

import Dashboard          from './pages/Dashboard'
import Proprietaires      from './pages/Proprietaires'
import ProprietaireDetail from './pages/ProprietaireDetail'
import ProprietaireForm   from './pages/ProprietaireForm'
import Maisons            from './pages/Maisons'
import MaisonDetail       from './pages/MaisonDetail'
import MaisonForm         from './pages/MaisonForm'
import MenageDetail       from './pages/MenageDetail'
import MenageForm         from './pages/MenageForm'
import LocataireAssign    from './pages/LocataireAssign'
import Locataires         from './pages/Locataires'
import Profile            from './pages/Profile'
import Admin              from './pages/Admin'

const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/cgu', '/auth/callback']

function AppShell() {
  const user           = useAuthStore(s => s.user)
  const profile        = useAuthStore(s => s.profile)
  const refreshProfile = useAuthStore(s => s.refreshProfile)
  const location       = useLocation()
  usePushNotifications()
  const isAuth = AUTH_ROUTES.includes(location.pathname)

  // Retry auto si user connecté mais profil pas encore chargé
  useEffect(() => {
    if (user && !profile) {
      const t = setTimeout(() => refreshProfile(), 2000)
      return () => clearTimeout(t)
    }
  }, [user, profile])

  // Non connecté → login
  if (!user && !isAuth) return <Navigate to="/login" replace />

  // Pages publiques
  if (isAuth) return (
    <Routes>
      <Route path="/login"           element={<Login />} />
      <Route path="/register"        element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/cgu"             element={<CGU />} />
      <Route path="/auth/callback"   element={<AuthCallback />} />
      <Route path="/reset-password"  element={<ResetPassword />} />
    </Routes>
  )

  // Profil pas encore chargé → spinner (pas ComptePending)
  if (user && !profile) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Chargement du profil…</p>
      </div>
    </div>
  )

  // Compte en attente ou suspendu
  if (profile.statut !== 'actif') {
    return <ComptePending statut={profile.statut} />
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <OfflineBanner />
        <Routes>
          <Route path="/"                                              element={<Dashboard />} />
          <Route path="/proprietaires"                                 element={<Proprietaires />} />
          <Route path="/proprietaires/nouveau"                         element={<ProprietaireForm />} />
          <Route path="/proprietaires/:id"                             element={<ProprietaireDetail />} />
          <Route path="/proprietaires/:id/edit"                        element={<ProprietaireForm />} />
          <Route path="/maisons"                                       element={<Maisons />} />
          <Route path="/maisons/nouveau"                               element={<MaisonForm />} />
          <Route path="/maisons/:id"                                   element={<MaisonDetail />} />
          <Route path="/maisons/:id/edit"                              element={<MaisonForm />} />
          <Route path="/maisons/:maisonId/menages/nouveau"             element={<MenageForm />} />
          <Route path="/maisons/:maisonId/menages/:menageId"           element={<MenageDetail />} />
          <Route path="/maisons/:maisonId/menages/:menageId/edit"      element={<MenageForm />} />
          <Route path="/maisons/:maisonId/menages/:menageId/locataire" element={<LocataireAssign />} />
          <Route path="/locataires"                                    element={<Locataires />} />
          <Route path="/profil"                                        element={<Profile />} />
          <Route path="/cgu"                                           element={<CGU />} />
          {isAdmin && <Route path="/admin"                            element={<Admin />} />}
          <Route path="*"                                              element={<Navigate to="/" />} />
        </Routes>
        <BottomNav isAdmin={isAdmin} />
      </div>
    </div>
  )
}

export default function App() {
  const init    = useAuthStore(s => s.init)
  const loading = useAuthStore(s => s.loading)

  useEffect(() => { init() }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600">
      <div className="text-center text-white">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="font-semibold">Chargement…</p>
      </div>
    </div>
  )

  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
