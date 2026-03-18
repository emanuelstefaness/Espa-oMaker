import { useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { uploadAvatar } from '../services/appUsers'
import { useUnreadCounts } from '../hooks/useUnreadCounts'

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="ml-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-semibold text-white">
      {count > 99 ? '99+' : count}
    </span>
  )
}

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { appUser, signOut, refreshAppUser } = useAuth()
  const unread = useUnreadCounts(appUser?.id)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const isFelipe = appUser?.role === 'felipe'

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !appUser) return
    if (!file.type.startsWith('image/')) return
    setUploadingAvatar(true)
    try {
      await uploadAvatar(appUser.id, file)
      await refreshAppUser()
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <aside className="hidden w-56 flex-col border-r border-slate-200 bg-white shadow-sm md:flex">
        <div className="border-b border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white font-semibold">
              C
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Cilla Tech Park
              </p>
              <p className="text-xs text-slate-500">Espaço Maker</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/demandas"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            Todas as demandas
          </NavLink>
          <NavLink
            to="/demandas/minhas"
            className={({ isActive }) =>
              `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            Minhas demandas
            <NavBadge count={unread.minhas} />
          </NavLink>
          <NavLink
            to="/demandas/nova"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            Nova demanda
          </NavLink>
          <NavLink
            to="/prontos"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            Prontos / galeria
          </NavLink>
          <NavLink
            to="/demandas-whatsapp"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            Demandas WhatsApp
          </NavLink>
          {(isFelipe || appUser?.role === 'executor') && (
            <NavLink
              to="/triagem"
              className={({ isActive }) =>
                `mt-2 flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-50 text-amber-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              Triagem (atribuir)
              <NavBadge count={unread.triagem} />
            </NavLink>
          )}
          {isFelipe && (
            <NavLink
              to="/orcamentos"
              className={({ isActive }) =>
                `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-50 text-amber-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              Orçamentos
            </NavLink>
          )}
          <NavLink
            to="/agenda"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            Agenda
          </NavLink>
          <NavLink
            to="/feed"
            className={({ isActive }) =>
              `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            Feed
            <NavBadge count={unread.feed} />
          </NavLink>
          <div className="my-2 border-t border-slate-100 pt-2">
            <NavLink
              to="/relatorios"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`
              }
            >
              Relatórios
            </NavLink>
          </div>
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3">
            <label className="relative cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
              />
              {appUser?.avatar_url ? (
                <img
                  src={appUser.avatar_url}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-200"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600">
                  {appUser?.name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
              )}
              {uploadingAvatar && (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-xs text-white">
                  ...
                </span>
              )}
            </label>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">
                {appUser?.name}
              </p>
              <p className="truncate text-xs text-slate-500">{appUser?.email}</p>
              <p className="text-xs text-slate-400">
                {isFelipe ? 'Triagem' : 'Executor'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 text-xs text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
          >
            Alterar foto
          </button>
          <button
            type="button"
            onClick={() => signOut()}
            className="mt-1 block text-xs text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
          >
            Sair
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:hidden">
          <p className="text-sm font-semibold text-slate-800">
            Cilla Tech Park · Espaço Maker
          </p>
          <div className="flex items-center gap-2">
            {appUser?.avatar_url ? (
              <img
                src={appUser.avatar_url}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                {appUser?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
            )}
            <span className="max-w-[120px] truncate text-right text-sm text-slate-600">
              {appUser?.name}
            </span>
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              Sair
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
