import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutShell } from '../components/LayoutShell'
import { TicketStatusPill } from '../components/TicketStatusPill'
import { UserAvatar } from '../components/UserAvatar'
import type { Ticket } from '../types/ticket'
import { listTickets } from '../services/tickets'
import { getTicketCardClasses } from '../constants/ticketOptions'

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const MAX_EVENTS_PER_CELL = 3

interface CalendarCell {
  ymd: string
  day: number
  inMonth: boolean
}

function toLocalYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildMonthGrid(viewMonth: Date): CalendarCell[] {
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7
  const gridStart = new Date(year, month, 1 - mondayOffset)

  const cells: CalendarCell[] = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + i)
    cells.push({
      ymd: toLocalYMD(date),
      day: date.getDate(),
      inMonth: date.getMonth() === month,
    })
  }
  return cells
}

export function AgendaPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedYmd, setSelectedYmd] = useState<string | null>(() =>
    toLocalYMD(new Date()),
  )

  const calendarCells = useMemo(() => buildMonthGrid(viewMonth), [viewMonth])
  const dataInicial = calendarCells[0]?.ymd ?? toLocalYMD(viewMonth)
  const dataFinal = calendarCells[calendarCells.length - 1]?.ymd ?? dataInicial
  const hoje = toLocalYMD(new Date())

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
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Erro ao carregar agenda.'),
      )
      .finally(() => setLoading(false))
  }, [dataInicial, dataFinal])

  const byDate = useMemo(() => {
    const map = new Map<string, Ticket[]>()
    for (const t of tickets) {
      if (!t.data_entrega) continue
      const key = t.data_entrega.slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return map
  }, [tickets])

  const semPrazo = useMemo(
    () => tickets.filter((t) => !t.data_entrega),
    [tickets],
  )

  const selectedTickets = selectedYmd ? (byDate.get(selectedYmd) ?? []) : []

  const goPrevMonth = () => {
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  }

  const goNextMonth = () => {
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
  }

  const goToday = () => {
    const now = new Date()
    setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedYmd(toLocalYMD(now))
  }

  const monthLabel = `${MONTH_NAMES[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`

  return (
    <LayoutShell>
      <div className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Agenda</h1>
            <p className="mt-1 text-sm text-slate-500">
              Calendário mensal com prazos de entrega das demandas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={goPrevMonth}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              aria-label="Mês anterior"
            >
              ←
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
              onClick={goNextMonth}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              aria-label="Próximo mês"
            >
              →
            </button>
          </div>
        </header>

        <p className="text-sm font-semibold text-slate-700">{monthLabel}</p>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {label}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="px-4 py-16 text-center text-sm text-slate-500">
              Carregando calendário...
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarCells.map((cell) => {
                const dayTickets = byDate.get(cell.ymd) ?? []
                const isToday = cell.ymd === hoje
                const isPast = cell.ymd < hoje
                const isSelected = cell.ymd === selectedYmd
                const hiddenCount = Math.max(
                  0,
                  dayTickets.length - MAX_EVENTS_PER_CELL,
                )

                return (
                  <button
                    key={cell.ymd}
                    type="button"
                    onClick={() => setSelectedYmd(cell.ymd)}
                    className={`min-h-[110px] border-b border-r border-slate-100 p-1.5 text-left transition-colors sm:min-h-[128px] ${
                      !cell.inMonth
                        ? 'bg-slate-50/80'
                        : isSelected
                          ? 'bg-blue-50/80 ring-1 ring-inset ring-blue-300'
                          : isToday
                            ? 'bg-blue-50/40'
                            : 'bg-white hover:bg-slate-50/60'
                    } ${isPast && cell.inMonth ? 'opacity-85' : ''}`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-1">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                          isToday
                            ? 'bg-blue-600 text-white'
                            : cell.inMonth
                              ? 'text-slate-700'
                              : 'text-slate-400'
                        }`}
                      >
                        {cell.day}
                      </span>
                      {dayTickets.length > 0 && (
                        <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          {dayTickets.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      {dayTickets.slice(0, MAX_EVENTS_PER_CELL).map((ticket) => (
                        <Link
                          key={ticket.id}
                          to={`/demandas/${ticket.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`block truncate rounded border px-1 py-0.5 text-[10px] font-medium leading-tight text-slate-800 sm:text-xs ${getTicketCardClasses(ticket.categoria, ticket.prioridade)}`}
                          title={ticket.titulo}
                        >
                          {ticket.codigo ? `${ticket.codigo} ` : ''}
                          {ticket.titulo}
                        </Link>
                      ))}
                      {hiddenCount > 0 && (
                        <span className="block px-1 text-[10px] font-medium text-slate-500">
                          +{hiddenCount} mais
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {selectedYmd && !loading && (
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-800">
                {formatDayLabel(selectedYmd)}
                {selectedYmd === hoje && (
                  <span className="ml-2 rounded bg-blue-200 px-1.5 py-0.5 text-xs font-medium text-blue-900">
                    Hoje
                  </span>
                )}
              </h2>
              <span className="text-xs text-slate-500">
                {selectedTickets.length}{' '}
                {selectedTickets.length === 1 ? 'demanda' : 'demandas'}
              </span>
            </div>
            {selectedTickets.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">
                Nenhuma demanda com prazo neste dia.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {selectedTickets.map((ticket) => (
                  <li key={ticket.id}>
                    <Link
                      to={`/demandas/${ticket.id}`}
                      className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 sm:flex-nowrap"
                    >
                      <span className="min-w-0 flex-1 font-medium text-slate-800">
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
            )}
          </section>
        )}

        {semPrazo.length > 0 && !loading && (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600">
              Sem data de entrega definida ({semPrazo.length})
            </div>
            <ul className="divide-y divide-slate-100">
              {semPrazo.map((ticket) => (
                <li key={ticket.id}>
                  <Link
                    to={`/demandas/${ticket.id}`}
                    className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 sm:flex-nowrap"
                  >
                    <span className="min-w-0 flex-1 font-medium text-slate-800">
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
      </div>
    </LayoutShell>
  )
}

function formatDayLabel(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][
    date.getDay()
  ]
  return `${weekday}, ${d} de ${MONTH_NAMES[m - 1]} de ${y}`
}
