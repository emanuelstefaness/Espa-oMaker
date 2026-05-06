import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  requireFeedAccess?: boolean
}

export function ProtectedRoute({
  children,
  requireFeedAccess = false,
}: ProtectedRouteProps) {
  const { supabaseUser, appUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <span className="animate-pulse text-sm text-slate-400">
          Carregando...
        </span>
      </div>
    )
  }

  if (!supabaseUser) {
    return <Navigate to="/login" replace />
  }

  if (requireFeedAccess && appUser && appUser.can_access_feed === false) {
    return <Navigate to="/" replace />
  }

  return children
}

