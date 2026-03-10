import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutShell } from '../components/LayoutShell'
import { TicketStatusPill } from '../components/TicketStatusPill'
import { UserAvatar } from '../components/UserAvatar'
import type {
  Ticket,
  TicketCategoria,
  TicketPrioridade,
  TicketStatus,
  TicketTipo,
} from '../types/ticket'
import {
  listTickets,
  listTasksByResponsavel,
} from '../services/tickets'
import type { TicketTaskWithDemanda } from '../services/tickets'
import { listAppUsers } from '../services/appUsers'
import type { AppUserOption } from '../services/appUsers'
import { useAuth } from '../auth/AuthContext'
import { getTicketCardClasses } from '../constants/ticketOptions'

const TASK_STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  em_producao: 'Em produção',
  concluido: 'Concluído',
}

const PAGE_SIZE = 80

function formatPrazo(data: string | null | undefined): string {
  if (!data) return '—'
  const d = data.split('-')
  return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : data
}

export function TicketListPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<TicketStatus | 'atrasadas' | ''>('')
  const [prioridade, setPrioridade] = useState<TicketPrioridade | ''>('')
  const [categoria, setCategoria] = useState<TicketCategoria | ''>('')
  const [tipo, setTipo] = useState<TicketTipo | ''>('')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [responsavelId, setResponsavelId] = useState('')
  const [appUsers, setAppUsers] = useState<AppUserOption[]>([])
  const location = useLocation()
  const { appUser } = useAuth()
  const isMinhasDemandas = location.pathname === '/demandas/minhas'
  const [myTasks, setMyTasks] = useState<TicketTaskWithDemanda[]>([])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const pStatus = params.get('status')
    if (pStatus) setStatus(pStatus as TicketStatus | '')
  }, [location.search])

  const filters = {
    search: search || undefined,
    status: status || undefined,
    prioridade: prioridade || undefined,
    categoria: categoria || undefined,
    tipo: tipo || undefined,
    dataInicial: dataInicial || undefined,
    dataFinal: dataFinal || undefined,
    responsavelId: responsavelId || undefined,
  }

  const load = async (
    pageOffset?: number,
    overrides?: Partial<typeof filters> & {
      statusIn?: TicketStatus[]
      responsavelOuColaboradorId?: string
      responsavelId?: string
    },
  ) => {
    const isInitial = pageOffset === undefined || pageOffset === 0
    const mergedFilters = {
      ...filters,
      ...overrides,
      ...(isMinhasDemandas && appUser?.id
        ? { responsavelOuColaboradorId: appUser.id }
        : {}),
    }
    try {
      if (isInitial) {
        setLoading(true)
        setError(null)
      }
      const offset = isInitial ? 0 : pageOffset ?? 0
      const { tickets: data, hasMore: more } = await listTickets(mergedFilters, {
        limit: PAGE_SIZE,
        offset,
        orderBy: 'data_entrega',
        orderDirection: 'asc',
      })
      const list = data ?? []
      const exibirLista =
        mergedFilters.status === 'cancelada' || mergedFilters.statusIn
          ? list
          : list.filter((t) => t.status !== 'cancelada')
      if (isInitial) {
        setTickets(exibirLista)
      } else {
        setTickets((prev) => [...prev, ...exibirLista])
      }
      setHasMore(more)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao carregar demandas.'
      setError(message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    await load(tickets.length)
  }

  useEffect(() => {
    if (!isMinhasDemandas) {
      listAppUsers().then(setAppUsers).catch(() => setAppUsers([]))
    }
  }, [isMinhasDemandas])

  useEffect(() => {
    if (isMinhasDemandas) {
      load(0)
      if (appUser?.id) {
        listTasksByResponsavel(appUser.id).then(setMyTasks).catch(() => setMyTasks([]))
      } else {
        setMyTasks([])
      }
      return
    }
    const params = new URLSearchParams(location.search)
    const statusParam = params.get('status')
    if (!statusParam) {
      load(0)
      return
    }
    if (statusParam.includes(',')) {
      const statusIn = statusParam.split(',') as TicketStatus[]
      load(0, { statusIn })
    } else {
      load(0, { status: statusParam as TicketStatus })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, location.pathname, isMinhasDemandas, appUser?.id])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    load(0)
  }

  const limparFiltros = () => {
    setSearch('')
    setStatus('')
    setPrioridade('')
    setCategoria('')
    setTipo('')
    setDataInicial('')
    setDataFinal('')
    setResponsavelId('')
    setTimeout(() => load(0), 0)
  }

  const minhas = tickets.filter(
    (t) =>
      t.responsavel_id === appUser?.id || t.colaborador_id === appUser?.id,
  )

  return (
    <LayoutShell>
      <section className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              {isMinhasDemandas ? 'Minhas demandas' : 'Todas as demandas'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isMinhasDemandas ? (
                <>
                  Demandas em que você é responsável ou colaborador.
                  {!loading && (
                    <span className="ml-1 font-medium text-slate-600">
                      Você tem {tickets.length} demanda{tickets.length !== 1 ? 's' : ''} e {myTasks.length} task{myTasks.length !== 1 ? 's' : ''}.
                    </span>
                  )}
                </>
              ) : (
                'Lista com demandas, prazos e responsáveis.'
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isMinhasDemandas && (
              <Link
                to="/demandas"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Ver todas as demandas
              </Link>
            )}
            <Link
              to="/demandas/nova"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
            >
              + Nova demanda
            </Link>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
        >
          <div className="relative min-w-[200px] flex-1">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-3 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TicketStatus | 'atrasadas' | '')}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">Todos os status</option>
            <option value="recebida">Recebida</option>
            <option value="em_analise">Em análise</option>
            <option value="aguardando_aprovacao">Aguardando aprovação</option>
            <option value="aprovado">Aprovado</option>
            <option value="em_producao">Em produção</option>
            <option value="pos_processo">Pós-processo</option>
            <option value="pronta">Pronta</option>
            <option value="entregue">Entregue</option>
            <option value="cancelada">Cancelada</option>
            <option value="atrasadas">Atrasadas</option>
          </select>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TicketTipo | '')}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">Todos os tipos</option>
            <option value="interna">Interna</option>
            <option value="externa">Externa</option>
          </select>
          {!isMinhasDemandas && (
            <select
              value={responsavelId}
              onChange={(e) => setResponsavelId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">Todos os responsáveis</option>
              {appUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="submit"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Filtrar
          </button>
          <button
            type="button"
            onClick={limparFiltros}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Limpar
          </button>
        </form>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {isMinhasDemandas && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">
              Tasks atribuídas a mim
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Tasks de qualquer demanda em que você é o responsável.
            </p>
            {myTasks.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Nenhuma task atribuída a você.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {myTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800">{task.titulo}</p>
                      <p className="text-xs text-slate-500">
                        Demanda: {task.ticket_titulo}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        task.status === 'concluido'
                          ? 'bg-emerald-100 text-emerald-800'
                          : task.status === 'em_producao'
                            ? 'bg-violet-100 text-violet-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {TASK_STATUS_LABEL[task.status] ?? task.status}
                    </span>
                    <Link
                      to={`/demandas/${task.ticket_id}`}
                      className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Ver demanda
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Demanda</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Prazo</th>
                  <th className="w-16 px-4 py-3 text-right">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Carregando demandas...
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className={`transition-colors ${getTicketCardClasses(ticket.categoria, ticket.prioridade)}`}
                    >
                      <td className="px-4 py-3">
                        <Link
                          to={`/demandas/${ticket.id}`}
                          className="font-medium text-slate-800 hover:text-blue-600"
                        >
                          {ticket.titulo}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {ticket.solicitante_nome}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {ticket.responsavel_nome ? (
                          <UserAvatar
                            avatarUrl={ticket.responsavel_avatar_url}
                            name={ticket.responsavel_nome}
                            size="sm"
                            showName
                          />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <TicketStatusPill status={ticket.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatPrazo(ticket.data_entrega)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/demandas/${ticket.id}`}
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && tickets.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-slate-500">
              Nenhuma demanda encontrada.
            </div>
          )}
          {hasMore && !loading && (
            <div className="border-t border-slate-100 px-4 py-3">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                {loadingMore ? 'Carregando...' : 'Carregar mais'}
              </button>
            </div>
          )}
        </div>

        {!isMinhasDemandas && minhas.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">
              Minhas demandas
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Onde você é responsável ou colaborador.
            </p>
            <ul className="mt-3 space-y-2">
              {minhas.slice(0, 5).map((ticket) => (
                <li
                  key={ticket.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <Link
                    to={`/demandas/${ticket.id}`}
                    className="text-slate-700 hover:text-blue-600"
                  >
                    {ticket.titulo}
                  </Link>
                  <TicketStatusPill status={ticket.status} />
                </li>
              ))}
            </ul>
            <Link
              to="/demandas/minhas"
              className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Ver todas as minhas →
            </Link>
          </div>
        )}
      </section>
    </LayoutShell>
  )
}
