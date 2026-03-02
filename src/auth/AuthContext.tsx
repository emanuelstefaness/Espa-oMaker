import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

type AppUserRole = 'felipe' | 'executor' | 'admin'

export interface AppUser {
  id: string
  name: string
  email: string
  role: AppUserRole
}

interface AuthContextValue {
  supabaseUser: User | null
  appUser: AppUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const FELIPE_EMAIL = 'felipe@espacomaker.local'

function mapRole(email: string): AppUserRole {
  if (email === FELIPE_EMAIL) {
    return 'felipe'
  }
  return 'executor'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null
      setSupabaseUser(user ?? null)
      if (user) {
        const email = user.email ?? ''
        const name = user.user_metadata?.name ?? email.split('@')[0]
        setAppUser({
          id: user.id,
          name,
          email,
          role: mapRole(email),
        })
      } else {
        setAppUser(null)
      }
      setLoading(false)
    })

    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null
      setSupabaseUser(user ?? null)
      if (user) {
        const email = user.email ?? ''
        const name = user.user_metadata?.name ?? email.split('@')[0]
        setAppUser({
          id: user.id,
          name,
          email,
          role: mapRole(email),
        })
      }
      setLoading(false)
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

