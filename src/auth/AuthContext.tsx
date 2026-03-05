import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import {
  getAppUserProfile,
  type AppUserRole,
} from '../services/appUsers'

export interface AppUser {
  id: string
  name: string
  email: string
  role: AppUserRole
  avatar_url: string | null
}

interface AuthContextValue {
  supabaseUser: User | null
  appUser: AppUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshAppUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const FELIPE_EMAIL = 'felipe@espacomaker.local'

function mapRole(email: string): AppUserRole {
  if (email === FELIPE_EMAIL) {
    return 'felipe'
  }
  return 'executor'
}

async function resolveAppUser(user: User): Promise<AppUser> {
  const email = user.email ?? ''
  const fallback = {
    id: user.id,
    name: user.user_metadata?.name ?? email.split('@')[0],
    email,
    role: mapRole(email),
    avatar_url: null as string | null,
  }
  const profile = await getAppUserProfile(user.id)
  if (profile) {
    return {
      id: user.id,
      name: profile.name,
      email,
      role: profile.role,
      avatar_url: profile.avatar_url,
    }
  }
  return fallback
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshAppUser = useCallback(async () => {
    if (!supabaseUser) return
    try {
      const next = await resolveAppUser(supabaseUser)
      setAppUser(next)
    } catch {
      // mantém estado atual
    }
  }, [supabaseUser])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null
      setSupabaseUser(user ?? null)
      if (user) {
        resolveAppUser(user).then(setAppUser).finally(() => setLoading(false))
      } else {
        setAppUser(null)
        setLoading(false)
      }
    })

    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null
      setSupabaseUser(user ?? null)
      if (user) {
        resolveAppUser(user).then(setAppUser).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      throw error
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value: AuthContextValue = {
    supabaseUser,
    appUser,
    loading,
    signIn,
    signOut,
    refreshAppUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

