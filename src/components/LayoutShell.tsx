import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { appUser, signOut } = useAuth()
  const location = useLocation()

  const isFelipe = appUser?.role === 'felipe'

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="hidden w-60 flex-col border-r border-slate-800 bg-slate-950/60 p-4 md:flex">
        <div className="mb-6 flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-blue-600/20 ring-1 ring-blue-500/70" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
              Cilla Tech Park
            </p>
            <p className="text-xs text-slate-400">Espaço Maker</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 text-sm">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 font-medium ${
                isActive
                  ? 'bg-blue-600/20 text-blue-100'
                  : 'text-slate-300 hover:bg-slate-900'
              }`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/demandas"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 font-medium ${
                isActive
                  ? 'bg-blue-600/20 text-blue-100'
                  : 'text-slate-300 hover:bg-slate-900'
              }`
            }
          >
            Todas as demandas
          </NavLink>

          <NavLink
            to="/demandas/nova"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 font-medium ${
                isActive
                  ? 'bg-lime-400/25 text-lime-100'
                  : 'text-lime-300 hover:bg-slate-900'
              }`
            }
          >
            Nova demanda
          </NavLink>

          <NavLink
            to="/prontos"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-xs font-medium ${
                isActive
                  ? 'bg-lime-400/25 text-lime-100'
                  : 'text-lime-300 hover:bg-slate-900'
              }`
            }
          >
            Prontos / galeria
          </NavLink>

          {isFelipe && (
            <NavLink
              to="/triagem"
              className={({ isActive }) =>
                `mt-4 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-200'
                    : 'text-amber-300 hover:bg-slate-900'
                }`
              }
            >
              Caixa de entrada
            </NavLink>
          )}
        </nav>

        <nav className="mt-2 flex flex-col gap-1 text-[11px] text-slate-400">
          <NavLink
            to="/relatorios"
            className={({ isActive }) =>
              `rounded-md px-3 py-1.5 ${
                isActive
                  ? 'bg-blue-900 text-slate-50'
                  : 'hover:bg-slate-900'
              }`
            }
          >
            Relatórios
          </NavLink>
        </nav>

        <div className="mt-4 border-t border-slate-800 pt-4 text-xs text-slate-400">
          <p className="font-medium text-slate-200">{appUser?.name}</p>
          <p>{appUser?.email}</p>
          <p className="mt-1 capitalize text-blue-300">
            {isFelipe ? 'Felipe - triagem' : 'Executor'}
          </p>
          <button
            type="button"
            onClick={() => signOut()}
            className="mt-2 text-[11px] text-slate-400 underline underline-offset-4 hover:text-slate-200"
          >
            Sair
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/80 px-3 py-2 backdrop-blur md:hidden">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-300">
              Cilla Tech Park
            </p>
            <p className="text-xs text-slate-400">Espaço Maker</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <span className="max-w-[120px] truncate text-right">
              {appUser?.name}
            </span>
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-full border border-slate-700 px-2 py-1 text-[11px] hover:border-slate-500"
            >
              Sair
            </button>
          </div>
        </header>

        <main className="flex-1 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-950/90 p-3 md:p-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 md:gap-4">
            {location.pathname !== '/login' && (
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-lime-400" />
                  <span>On-line · fluxo interno do WhatsApp substituído</span>
                </div>
                <Link
                  to="/demandas/nova"
                  className="hidden rounded-full bg-lime-400 px-3 py-1 font-medium text-slate-950 shadow-sm shadow-lime-400/40 hover:bg-lime-300 md:inline-flex"
                >
                  Nova demanda
                </Link>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

