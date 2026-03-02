import { useEffect, useState } from 'react'
import { LayoutShell } from '../components/LayoutShell'
import { TicketStatusPill } from '../components/TicketStatusPill'
import type { Ticket } from '../types/ticket'
import { listTickets, updateTicketResponsavel } from '../services/tickets'
import { useAuth } from '../auth/AuthContext'

interface AppUserOption {
  id: string
  name: string
}

// Em um cenário real, você pode carregar esta lista da tabela app_users.
const EXECUTORES_FIXOS: AppUserOption[] = [
  { id: 'manu', name: 'Manu' },
  { id: 'gabriel', name: 'Gabriel' },
  { id: 'felipe', name: 'Felipe' },
  { id: 'jhonny', name: 'Jhonny' },
  { id: 'moreno', name: 'Moreno' },
]

export function InboxTriagemPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [selectedResponsavel, setSelectedResponsavel] = useState<
    Record<string, string>
  >({})
  const { appUser } = useAuth()

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await listTickets({ status: 'recebida' })
        setTickets(data)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao carregar recebidas.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleAtribuir = async (ticketId: string) => {
    const responsavel = selectedResponsavel[ticketId]
    if (!responsavel) return
    try {
      setSavingId(ticketId)
      const updated = await updateTicketResponsavel(ticketId, {
        responsavel_id: responsavel,
      })
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? updated : t)),
      )
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao atribuir responsável.'
      setError(message)
    } finally {
      setSavingId(null)
    }
  }

  const isFelipe = appUser?.role === 'felipe'

  return (
    <LayoutShell>
      <section className="space-y-4">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Caixa de entrada
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">
              Triagem de demandas recebidas
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Felipe define categoria, prioridade, tipo (interna/externa),
              prazo e atribui o responsável principal.
            </p>
          </div>
        </header>

        {!isFelipe && (
          <div className="rounded-2xl border border-amber-700/60 bg-amber-950/40 px-4 py-3 text-xs text-amber-50">
            Apenas Felipe (usuário de triagem) deve operar nesta tela. Os
            demais acompanham suas demandas em &quot;Minhas demandas&quot;.
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-6 text-center text-xs text-slate-400">
            Carregando recebidas...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-700/60 bg-rose-950/50 px-4 py-3 text-xs text-rose-50">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80">
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-[11px] text-slate-400">
              <span>{tickets.length} demandas recebidas</span>
            </div>
            <ul className="divide-y divide-slate-800 text-sm">
              {tickets.map((ticket) => (
                <li
                  key={ticket.id}
                  className="flex flex-col gap-3 px-3 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-medium text-slate-50">
                        {ticket.titulo}
                      </p>
                      <TicketStatusPill status={ticket.status} />
                    </div>
                    <p className="mt-1 line-clamp-1 text-[11px] text-slate-400">
                      {ticket.solicitante_nome}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] md:justify-end">
                    <select
                      disabled={!isFelipe}
                      value={selectedResponsavel[ticket.id] ?? ''}
                      onChange={(e) =>
                        setSelectedResponsavel((prev) => ({
                          ...prev,
                          [ticket.id]: e.target.value,
                        }))
                      }
                      className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-[11px] text-slate-50 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="">Definir responsável</option>
                      {EXECUTORES_FIXOS.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!isFelipe || savingId === ticket.id}
                      onClick={() => handleAtribuir(ticket.id)}
                      className="rounded-lg bg-cyan-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
                    >
                      {savingId === ticket.id ? 'Salvando...' : 'Atribuir'}
                    </button>
                  </div>
                </li>
              ))}
              {tickets.length === 0 && (
                <li className="px-3 py-4 text-[11px] text-slate-500">
                  Nenhuma demanda nova na caixa de entrada.
                </li>
              )}
            </ul>
          </div>
        )}
      </section>
    </LayoutShell>
  )
}

