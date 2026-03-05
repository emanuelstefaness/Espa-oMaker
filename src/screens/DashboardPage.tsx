import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutShell } from '../components/LayoutShell'
import { TicketStatusPill } from '../components/TicketStatusPill'
import { UserAvatar } from '../components/UserAvatar'
import type { Ticket } from '../types/ticket'
import { listTickets } from '../services/tickets'

const POLL_INTERVAL_MS = 15 * 60 * 1000 // 15 minutos

export function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { tickets: data } = await listTickets({}, { limit: 200 })
        setTickets(data)
      } catch {
        setTickets([])
      } finally {
        setLoading(false)
      }
    }
    load()

    const interval = setInterval(() => {
      listTickets({}, { limit: 200 })
        .then(({ tickets: data }) => setTickets(data))
        .catch(() => {})
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [])

  const recebidas = tickets.filter(
    (t) =>
      t.status === 'recebida' ||
      t.status === 'em_analise' ||
      t.status === 'orcamento_em_criacao',
  ).length
  const aguardando = tickets.filter(
    (t) => t.status === 'aguardando_aprovacao' || t.status === 'aprovado',
  ).length
  const emProducao = tickets.filter(
    (t) => t.status === 'em_producao' || t.status === 'pos_processo',
  ).length
  const hoje = new Date().toISOString().slice(0, 10)
  const atrasadas = tickets.filter(
    (t) =>
      t.data_entrega &&
      t.status !== 'entregue' &&
      t.status !== 'cancelada' &&
      t.data_entrega < hoje,
  ).length
  const prontas = tickets.filter((t) => t.status === 'pronta').length
  const entregues = tickets.filter((t) => t.status === 'entregue').length
  const canceladas = tickets.filter((t) => t.status === 'cancelada').length
  const filaAtiva = tickets.filter(
    (t) =>
      t.status !== 'entregue' &&
      t.status !== 'cancelada' &&
      (t.status === 'aguardando_aprovacao' ||
        t.status === 'aprovado' ||
        t.status === 'em_producao' ||
        t.status === 'pos_processo' ||
        t.status === 'em_analise'),
  )

  const PAGE_SIZE = 9
  const [carouselPage, setCarouselPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(filaAtiva.length / PAGE_SIZE))
  const filaAtivaPage = filaAtiva.slice(
    carouselPage * PAGE_SIZE,
    carouselPage * PAGE_SIZE + PAGE_SIZE,
  )
  const temMultiplasPaginas = filaAtiva.length > PAGE_SIZE

  const scrollCarousel = (dir: 'prev' | 'next') => {
    if (dir === 'prev') {
      setCarouselPage((p) => (p <= 0 ? totalPages - 1 : p - 1))
    } else {
      setCarouselPage((p) => (p >= totalPages - 1 ? 0 : p + 1))
    }
  }

  useEffect(() => {
    if (!temMultiplasPaginas || totalPages <= 1) return
    const interval = setInterval(() => {
      setCarouselPage((p) => (p >= totalPages - 1 ? 0 : p + 1))
    }, 10000)
    return () => clearInterval(interval)
  }, [temMultiplasPaginas, totalPages])

  return (
    <LayoutShell>
      <section className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-800 md:text-3xl">
              Demandas do Espaço Maker
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Acompanhe recebimento, orçamento, produção e entrega.
            </p>
          </div>
          <Link
            to="/demandas/nova"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
          >
            + Nova demanda
          </Link>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
          <SummaryCard
            to="/demandas?status=recebida,em_analise,orcamento_em_criacao"
            label="Recebidas"
            value={recebidas}
            className="border-slate-200 bg-white text-slate-700"
          />
          <SummaryCard
            to="/demandas?status=aguardando_aprovacao,aprovado"
            label="Aguardando aprovação"
            value={aguardando}
            className="border-amber-200 bg-amber-50 text-amber-800"
          />
          <SummaryCard
            to="/demandas?status=em_producao,pos_processo"
            label="Em produção"
            value={emProducao}
            className="border-violet-200 bg-violet-50 text-violet-800"
          />
          <SummaryCard
            to="/demandas?status=atrasadas"
            label="Atrasadas"
            value={atrasadas}
            className="border-rose-200 bg-rose-50 text-rose-800"
          />
          <SummaryCard
            to="/demandas?status=pronta"
            label="Prontas"
            value={prontas}
            className="border-lime-200 bg-lime-50 text-lime-800"
          />
          <SummaryCard
            to="/demandas?status=entregue"
            label="Entregues"
            value={entregues}
            className="border-slate-200 bg-slate-100 text-slate-700"
          />
          <SummaryCard
            to="/demandas?status=cancelada"
            label="Canceladas"
            value={canceladas}
            className="border-slate-300 bg-slate-100 text-slate-600"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">
                Fila ativa
              </h2>
              <Link
                to="/demandas"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Ver todas
              </Link>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {loading ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  Carregando...
                </div>
              ) : filaAtiva.length > 0 ? (
                <>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-2 py-1">
                    <button
                      type="button"
                      onClick={() => scrollCarousel('prev')}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                      aria-label="Anterior"
                      disabled={!temMultiplasPaginas}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-xs text-slate-500">
                      Página {carouselPage + 1}/{totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => scrollCarousel('next')}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                      aria-label="Próximo"
                      disabled={!temMultiplasPaginas}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 grid-rows-3 gap-2 py-3 px-2 min-h-[280px]">
                    {filaAtivaPage.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 transition-colors hover:bg-slate-100 flex flex-col min-h-0"
                      >
                        <Link
                          to={`/demandas/${ticket.id}`}
                          className="font-medium text-slate-800 hover:text-blue-600 line-clamp-2"
                        >
                          {ticket.titulo}
                        </Link>
                        <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <span className="line-clamp-1">{ticket.solicitante_nome}</span>
                          {ticket.responsavel_nome && (
                            <>
                              <span>·</span>
                              <UserAvatar
                                avatarUrl={ticket.responsavel_avatar_url}
                                name={ticket.responsavel_nome}
                                size="sm"
                                showName
                              />
                            </>
                          )}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <TicketStatusPill status={ticket.status} />
                          {ticket.prioridade === 'urgente' && (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                              Urgente
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                          Prazo: {ticket.data_entrega ?? '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filaAtiva.map((ticket) => (
                    <li
                      key={ticket.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/demandas/${ticket.id}`}
                          className="font-medium text-slate-800 hover:text-blue-600"
                        >
                          {ticket.titulo}
                        </Link>
                        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>{ticket.solicitante_nome}</span>
                          {ticket.responsavel_nome && (
                            <>
                              <span>·</span>
                              <UserAvatar
                                avatarUrl={ticket.responsavel_avatar_url}
                                name={ticket.responsavel_nome}
                                size="sm"
                                showName
                              />
                            </>
                          )}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <TicketStatusPill status={ticket.status} />
                          {ticket.prioridade === 'urgente' && (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                              Urgente
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">
                        {ticket.data_entrega ?? '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {!loading && filaAtiva.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  Nenhuma demanda na fila ativa.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700">
              Alertas rápidos
            </h2>
            <div className="space-y-3">
              <AlertCard
                title="Demandas atrasadas"
                description="Prazo de entrega vencido."
                value={atrasadas}
                tone="critical"
                to="/demandas"
              />
              <AlertCard
                title="Aguardando aprovação"
                description="Orçamentos aguardando retorno."
                value={aguardando}
                tone="warning"
                to="/demandas?status=aguardando_aprovacao"
              />
            </div>
          </div>
        </div>
      </section>
    </LayoutShell>
  )
}

function SummaryCard({
  to,
  label,
  value,
  className,
}: {
  to?: string
  label: string
  value: number
  className: string
}) {
  const content = (
    <>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
    </>
  )
  if (to) {
    return (
      <Link
        to={to}
        className={`block rounded-xl border px-4 py-4 shadow-sm transition-shadow hover:shadow ${className}`}
      >
        {content}
      </Link>
    )
  }
  return (
    <div
      className={`rounded-xl border px-4 py-4 shadow-sm transition-shadow hover:shadow ${className}`}
    >
      {content}
    </div>
  )
}

function AlertCard({
  title,
  description,
  value,
  tone,
  to,
}: {
  title: string
  description: string
  value: number
  tone: 'critical' | 'warning'
  to: string
}) {
  const styles =
    tone === 'critical'
      ? 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
      : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'

  return (
    <Link
      to={to}
      className={`block rounded-xl border px-4 py-3 shadow-sm transition-colors ${styles}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs opacity-90">{description}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-sm font-bold">
          {value}
        </span>
      </div>
    </Link>
  )
}
