import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user:    null,
  session: null,
  profile: null,   // statut, role, etc.
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
    const profile = user ? await fetchProfile(user.id) : null
    set({ session, user, profile, loading: false })

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null
      const profile = user ? await fetchProfile(user.id) : null
      set({ session, user, profile })
    })
  },

  refreshProfile: async () => {
    const { user } = get()
    if (!user) return
    const profile = await fetchProfile(user.id)
    set({ profile })
  },

  signUp: async ({ email, password, nom, telephone, cgu_acceptees }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nom, telephone, cgu_acceptees },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    // Si la confirmation email est désactivée dans Supabase,
    // une session est retournée immédiatement → on active le compte directement
    if (!error && data.session && data.user) {
      await supabase
        .from('profiles')
        .update({ statut: 'actif', role: 'agence' })
        .eq('id', data.user.id)
      const profile = await fetchProfile(data.user.id)
      set({ session: data.session, user: data.user, profile })
    }

    return { data, error }
  },

  signIn: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error && data.user) {
      const profile = await fetchProfile(data.user.id)
      set({ profile })
    }
    return { data, error }
  },

  signInLocataire: async ({ phone, password }) => {
    const phoneClean = phone.replace(/[^0-9]/g, '')
    const email = `loc.${phoneClean}@demarcheur.app`
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error && data.user) {
      const profile = await fetchProfile(data.user.id)
      set({ profile })
    }
    return { data, error }
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, profile: null })
  },
}))

async function fetchProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  return data
}
