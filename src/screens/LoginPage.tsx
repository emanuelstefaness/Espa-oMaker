import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { signIn, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao fazer login.'
      setError(message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-950 to-slate-950/90 px-4">
      <div className="w-full max-w-md rounded-2xl border border-blue-700/60 bg-slate-950/80 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur">
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
            Cilla Tech Park · Espaço Maker
          </p>
          <h1 className="text-xl font-semibold text-slate-50">
            Gerenciamento de demandas
          </h1>
          <p className="text-xs text-slate-400">
            Acompanhe triagem, orçamento, produção e entrega em um único lugar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium text-slate-200"
            >
              E-mail institucional
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 shadow-sm outline-none ring-0 placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="ex: felipe@espacomaker.local"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium text-slate-200"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 shadow-sm outline-none ring-0 placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Senha configurada no Supabase"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-[11px] text-rose-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-lime-400 px-3 py-2 text-sm font-semibold text-slate-950 shadow-[0_12px_40px_rgba(22,163,74,0.7)] transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Acesso restrito à equipe do Espaço Maker (Cilla Tech Park). Os usuários iniciais
            (Manu, Gabriel, Felipe, Jhonny e Moreno) devem ser criados no
            Supabase com e-mail e senha. Felipe é configurado com papel de
            triagem.
          </p>
        </form>
      </div>
    </div>
  )
}

