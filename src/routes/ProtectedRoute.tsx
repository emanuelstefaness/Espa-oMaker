import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  requireFeedAccess?: boolean
}

const DEV_BYPASS_AUTH = false

export function ProtectedRoute({
  children,
  requireFeedAccess = false,
}: ProtectedRouteProps) {
  const { supabaseUser, appUser, loading } = useAuth()

  if (DEV_BYPASS_AUTH) {
    return children
  }

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: 'var(--bg-app)' }}
      >
        <span className="animate-pulse text-sm" style={{ color: 'var(--text-muted)' }}>
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

