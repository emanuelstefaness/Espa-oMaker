import { useEffect, useState } from 'react'
import { LayoutShell } from '../components/LayoutShell'
import { TicketStatusPill } from '../components/TicketStatusPill'
import type { Ticket } from '../types/ticket'
import { listTickets, updateTicketResponsavel } from '../services/tickets'
import { listAppUsers } from '../services/appUsers'
import type { AppUserOption } from '../services/appUsers'
import { useAuth } from '../auth/AuthContext'

export function InboxTriagemPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [executores, setExecutores] = useState<AppUserOption[]>([])
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
        const [ticketsResult, usersData] = await Promise.all([
          listTickets({ status: 'recebida' }, { limit: 500 }),
          listAppUsers(),
        ])
        setTickets(ticketsResult.tickets)
        setExecutores(usersData)
      } catch (err) {
        const raw =
          err && typeof err === 'object' && 'message' in err
            ? String((err as Error).message)
            : 'Erro ao carregar recebidas.'
        setError(raw)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleAtribuir = async (ticketId: string) => {
    const responsavel = selectedResponsavel[ticketId]
    if (!responsavel) return
    if (
      !window.confirm(
        'Tem certeza que deseja atribuir esta demanda? O status será alterado para "Em análise".',
      )
    ) {
      return
    }
    try {
      setSavingId(ticketId)
      await updateTicketResponsavel(ticketId, {
        responsavel_id: responsavel,
        status: 'em_analise',
      })
      setTickets((prev) => prev.filter((t) => t.id !== ticketId))
      setSelectedResponsavel((prev) => {
        const next = { ...prev }
        delete next[ticketId]
        return next
      })
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
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-slate-800">
            Caixa de entrada
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Triagem de demandas recebidas. Atribua o responsável para seguir o fluxo.
          </p>
        </header>

        {!isFelipe && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Apenas o usuário de triagem (Felipe) pode atribuir responsável. Você pode visualizar as demandas recebidas.
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-medium text-slate-600">
              {tickets.length} demandas recebidas
            </span>
          </div>
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              Carregando...
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <li
                  key={ticket.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800">{ticket.titulo}</p>
                    <p className="text-sm text-slate-500">
                      {ticket.solicitante_nome}
                    </p>
                    <div className="mt-2">
                      <TicketStatusPill status={ticket.status} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      disabled={!isFelipe}
                      value={selectedResponsavel[ticket.id] ?? ''}
                      onChange={(e) =>
                        setSelectedResponsavel((prev) => ({
                          ...prev,
                          [ticket.id]: e.target.value,
                        }))
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-60"
                    >
                      <option value="">Definir responsável</option>
                      {executores.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!isFelipe || savingId === ticket.id}
                      onClick={() => handleAtribuir(ticket.id)}
                      className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
                    >
                      {savingId === ticket.id ? 'Salvando...' : 'Atribuir'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!loading && tickets.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              Nenhuma demanda nova na caixa de entrada.
            </div>
          )}
        </div>
      </section>
    </LayoutShell>
  )
}
