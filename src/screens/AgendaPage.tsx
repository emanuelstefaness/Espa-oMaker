import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutShell } from '../components/LayoutShell'
import { TicketStatusPill } from '../components/TicketStatusPill'
import { UserAvatar } from '../components/UserAvatar'
import type { Ticket } from '../types/ticket'
import { listTickets } from '../services/tickets'

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function getWeekStart(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.getFullYear(), d.getMonth(), diff)
}

export function AgendaPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()))

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 34)
  const dataInicial = toYMD(weekStart)
  const dataFinal = toYMD(weekEnd)

  useEffect(() => {
    setLoading(true)
    setError(null)
    listTickets(
      {
        dataInicial,
        dataFinal,
        includeCancelada: false,
      },
      {
        limit: 500,
        orderBy: 'data_entrega',
        orderDirection: 'asc',
      },
    )
      .then(({ tickets: data }) => setTickets(data ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar agenda.'))
      .finally(() => setLoading(false))
  }, [dataInicial, dataFinal])

  const byDate = new Map<string, Ticket[]>()
  const hoje = toYMD(new Date())
  for (const t of tickets) {
    const key = t.data_entrega ?? '__sem_prazo__'
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key)!.push(t)
  }

  const orderedDates: string[] = []
  const d = new Date(weekStart)
  for (let i = 0; i < 35; i++) {
    orderedDates.push(toYMD(d))
    d.setDate(d.getDate() + 1)
  }
  const semPrazo = byDate.get('__sem_prazo__') ?? []
  if (semPrazo.length > 0) byDate.delete('__sem_prazo__')

  const goPrev = () => {
    const next = new Date(weekStart)
    next.setDate(next.getDate() - 7)
    setWeekStart(next)
  }
  const goNext = () => {
    const next = new Date(weekStart)
    next.setDate(next.getDate() + 7)
    setWeekStart(next)
  }
  const goToday = () => setWeekStart(getWeekStart(new Date()))

  const labelRange =
    weekStart.getMonth() === weekEnd.getMonth()
      ? `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getFullYear()}`
      : `${MONTH_NAMES[weekStart.getMonth()]} – ${MONTH_NAMES[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`

  return (
    <LayoutShell>
      <div className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Agenda</h1>
            <p className="text-sm text-slate-500">
              Prazos e pedidos por data de entrega.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ← Semana anterior
            </button>
            <button
              type="button"
              onClick={goToday}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Próxima semana →
            </button>
          </div>
        </header>

        <p className="text-sm font-medium text-slate-600">{labelRange}</p>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            A carregar agenda...
          </div>
        ) : (
          <div className="space-y-6">
            {orderedDates.map((dateStr) => {
              const dayTickets = byDate.get(dateStr) ?? []
              if (dayTickets.length === 0) return null
              const [y, m, day] = dateStr.split('-').map(Number)
              const dateObj = new Date(y, m - 1, day)
              const dayName = DAY_NAMES[dateObj.getDay()]
              const isToday = dateStr === hoje
              const isPast = dateStr < hoje
              return (
                <section
                  key={dateStr}
                  className={`rounded-xl border bg-white shadow-sm overflow-hidden ${
                    isToday
                      ? 'border-blue-300 ring-1 ring-blue-200'
                      : isPast
                        ? 'border-slate-200 opacity-90'
                        : 'border-slate-200'
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 border-b px-4 py-2.5 text-sm font-medium ${
                      isToday
                        ? 'border-blue-200 bg-blue-50 text-blue-800'
                        : isPast
                          ? 'border-slate-100 bg-slate-50 text-slate-600'
                          : 'border-slate-100 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>
                      {dayName}, {Number(day)} {MONTH_NAMES[m - 1]}
                    </span>
                    {isToday && (
                      <span className="rounded bg-blue-200 px-1.5 py-0.5 text-xs text-blue-900">
                        Hoje
                      </span>
                    )}
                    <span className="ml-auto text-slate-500">
                      {dayTickets.length} {dayTickets.length === 1 ? 'demanda' : 'demandas'}
                    </span>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {dayTickets.map((ticket) => (
                      <li key={ticket.id}>
                        <Link
                          to={`/demandas/${ticket.id}`}
                          className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 sm:flex-nowrap"
                        >
                          <span className="w-full font-medium text-slate-800 sm:w-auto sm:min-w-[140px]">
                            {ticket.codigo ? `${ticket.codigo} – ` : ''}
                            {ticket.titulo}
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-600">
                            {ticket.responsavel_nome ? (
                              <UserAvatar
                                avatarUrl={ticket.responsavel_avatar_url}
                                name={ticket.responsavel_nome}
                                size="sm"
                                showName
                              />
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </span>
                          <TicketStatusPill status={ticket.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}

            {semPrazo.length > 0 && (
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600">
                  Sem data de entrega definida
                </div>
                <ul className="divide-y divide-slate-100">
                  {semPrazo.map((ticket) => (
                    <li key={ticket.id}>
                      <Link
                        to={`/demandas/${ticket.id}`}
                        className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 sm:flex-nowrap"
                      >
                        <span className="w-full font-medium text-slate-800 sm:w-auto sm:min-w-[140px]">
                          {ticket.codigo ? `${ticket.codigo} – ` : ''}
                          {ticket.titulo}
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-600">
                          {ticket.responsavel_nome ? (
                            <UserAvatar
                              avatarUrl={ticket.responsavel_avatar_url}
                              name={ticket.responsavel_nome}
                              size="sm"
                              showName
                            />
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </span>
                        <TicketStatusPill status={ticket.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {!loading && tickets.length === 0 && semPrazo.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                Nenhuma demanda com prazo neste período.
              </div>
            )}
          </div>
        )}
      </div>
    </LayoutShell>
  )
}
