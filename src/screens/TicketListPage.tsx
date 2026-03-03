import { useEffect, useState } from 'react'
import type { FormEvent, SelectHTMLAttributes } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutShell } from '../components/LayoutShell'
import { TicketStatusPill } from '../components/TicketStatusPill'
import type {
  Ticket,
  TicketCategoria,
  TicketPrioridade,
  TicketStatus,
  TicketTipo,
} from '../types/ticket'
import { listTickets } from '../services/tickets'
import { useAuth } from '../auth/AuthContext'

export function TicketListPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<TicketStatus | ''>('')
  const [prioridade, setPrioridade] = useState<TicketPrioridade | ''>('')
  const [categoria, setCategoria] = useState<TicketCategoria | ''>('')
  const [tipo, setTipo] = useState<TicketTipo | ''>('')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const location = useLocation()
  const { appUser } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const pStatus = params.get('status') as TicketStatus | null
    if (pStatus) setStatus(pStatus)
  }, [location.search])

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await listTickets({
        search: search || undefined,
        status: status || undefined,
        prioridade: prioridade || undefined,
        categoria: categoria || undefined,
        tipo: tipo || undefined,
        dataInicial: dataInicial || undefined,
        dataFinal: dataFinal || undefined,
      })
      setTickets(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao carregar demandas.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    load()
  }

  const minhas = tickets.filter(
    (t) => t.responsavel_id === appUser?.id || t.colaborador_id === appUser?.id,
  )

  return (
    <LayoutShell>
      <section className="space-y-4">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Lista geral
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">
              Demandas do Espaço Maker
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Filtre por status, responsável, prioridade, categoria e tipo.
            </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="grid gap-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs md:grid-cols-4 md:items-end"
        >
          <div className="md:col-span-2">
            <label className="mb-1 block text-[11px] font-medium text-slate-300">
              Busca
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Título, solicitante, código..."
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <SelectField
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TicketStatus | '')}
          >
            <option value="">Todos</option>
            <option value="recebida">Recebida</option>
            <option value="em_analise">Em análise</option>
            <option value="aguardando_aprovacao">Aguardando aprovação</option>
            <option value="em_producao">Em produção</option>
            <option value="pos_processo">Pós-processo</option>
            <option value="pronta">Pronta</option>
            <option value="entregue">Entregue</option>
            <option value="cancelada">Cancelada</option>
          </SelectField>

          <SelectField
            label="Prioridade"
            value={prioridade}
            onChange={(e) =>
              setPrioridade(e.target.value as TicketPrioridade | '')
            }
          >
            <option value="">Todas</option>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </SelectField>

          <SelectField
            label="Categoria"
            value={categoria}
            onChange={(e) =>
              setCategoria(e.target.value as TicketCategoria | '')
            }
          >
            <option value="">Todas</option>
            <option value="impressao_3d">Impressão 3D</option>
            <option value="modelagem_3d">Modelagem 3D</option>
            <option value="reparo">Reparo</option>
            <option value="laser">Laser</option>
            <option value="outros">Outros</option>
          </SelectField>

          <SelectField
            label="Tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TicketTipo | '')}
          >
            <option value="">Todos</option>
            <option value="interna">Interna</option>
            <option value="externa">Externa</option>
          </SelectField>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-300">
              Prazo inicial
            </label>
            <input
              type="date"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-300">
              Prazo final
            </label>
            <input
              type="date"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="flex gap-2 md:col-span-4 md:justify-end">
            <button
              type="submit"
              className="inline-flex items-center rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-cyan-400"
            >
              Aplicar filtros
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setStatus('')
                setPrioridade('')
                setCategoria('')
                setTipo('')
                setDataInicial('')
                setDataFinal('')
                load()
              }}
              className="inline-flex items-center rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:border-slate-500"
            >
              Limpar
            </button>
          </div>
        </form>

        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-6 text-center text-xs text-slate-400">
            Carregando demandas...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-700/60 bg-rose-950/50 px-4 py-3 text-xs text-rose-50">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80">
              <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-[11px] text-slate-400">
                <span>{tickets.length} demandas encontradas</span>
              </div>
              <ul className="divide-y divide-slate-800 text-sm">
                {tickets.map((ticket) => (
                  <li
                    key={ticket.id}
                    className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-slate-900/60"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/demandas/${ticket.id}`}
                          className="truncate text-[13px] font-medium text-slate-50 hover:text-cyan-300"
                        >
                          {ticket.titulo}
                        </Link>
                        <span className="rounded-full border border-slate-700 px-2 py-[2px] text-[10px] uppercase tracking-[0.16em] text-slate-400">
                          {ticket.tipo === 'externa' ? 'Externa' : 'Interna'}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-[11px] text-slate-400">
                        {ticket.solicitante_nome}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <TicketStatusPill status={ticket.status} />
                        {ticket.prioridade === 'urgente' && (
                          <span className="rounded-full border border-rose-500/60 bg-rose-500/10 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-200">
                            Urgente
                          </span>
                        )}
                        {ticket.orcamento && (
                          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-[2px] text-[10px] font-medium text-emerald-200">
                            Orç.: R$ {ticket.orcamento.total.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="hidden flex-col items-end gap-1 text-[11px] text-slate-400 sm:flex">
                      <span className="rounded-full border border-slate-700 px-2 py-[2px]">
                        Resp.: {ticket.responsavel_nome ?? '—'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Criada em {ticket.data_criacao}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-xs">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Minhas demandas
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Demandas onde você é responsável principal ou colaborador.
                </p>
                <ul className="mt-3 space-y-2">
                  {minhas.map((ticket) => (
                    <li key={ticket.id} className="text-[11px]">
                      <Link
                        to={`/demandas/${ticket.id}`}
                        className="line-clamp-2 text-slate-100 hover:text-cyan-300"
                      >
                        {ticket.titulo}
                      </Link>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                        <TicketStatusPill status={ticket.status} />
                      </div>
                    </li>
                  ))}
                  {minhas.length === 0 && (
                    <li className="mt-2 text-[11px] text-slate-500">
                      Nenhuma demanda atribuída a você ainda.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </section>
    </LayoutShell>
  )
}

interface SelectFieldProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
}

function SelectField({ label, children, ...rest }: SelectFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-slate-300">
        {label}
      </label>
      <select
        {...rest}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
      >
        {children}
      </select>
    </div>
  )
}

