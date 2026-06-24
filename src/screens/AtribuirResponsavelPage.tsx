import { useEffect, useState } from 'react'
import { UserCheck } from 'lucide-react'
import { LayoutShell } from '../components/LayoutShell'
import { TicketStatusPill } from '../components/TicketStatusPill'
import type { Ticket } from '../types/ticket'
import { listTickets, updateTicketResponsavel } from '../services/tickets'
import { listAppUsers } from '../services/appUsers'
import type { AppUserOption } from '../services/appUsers'
import { useAuth } from '../auth/AuthContext'

export function AtribuirResponsavelPage() {
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
          listTickets({ status: 'aprovado' }, { limit: 500 }),
          listAppUsers(),
        ])
        const ready = ticketsResult.tickets.filter((t) => !t.responsavel_id)
        setTickets(ready)
        setExecutores(usersData)
      } catch (err) {
        const raw =
          err && typeof err === 'object' && 'message' in err
            ? String((err as Error).message)
            : 'Erro ao carregar demandas aprovadas.'
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
        <header className="page-header">
          <h1>Definir responsável</h1>
          <p>
            Demandas com status <strong>Orçamento aprovado</strong> entram aqui
            para atribuição do responsável.
          </p>
        </header>

        {!isFelipe && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Apenas o usuário de triagem (Felipe) pode atribuir responsável. Você
            pode visualizar.
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="ctp-card overflow-hidden">
          <div className="flex items-center gap-2 px-7 py-3.5" style={{ borderBottom: '1px solid var(--border-default)' }}>
            <span className="badge" style={{ background: 'rgba(6,58,112,0.08)', color: 'var(--ctp-navy)' }}>
              {tickets.length}
            </span>
            <span className="text-[13px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {tickets.length === 1 ? 'demanda para atribuir' : 'demandas para atribuir'}
            </span>
          </div>
          {loading ? (
            <div className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Carregando...
            </div>
          ) : (
            <ul>
              {tickets.map((ticket) => (
                <li
                  key={ticket.id}
                  className="flex flex-col gap-3 px-7 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderTop: '1px solid var(--border-default)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(6,58,112,0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{ticket.titulo}</p>
                      <TicketStatusPill status={ticket.status} />
                    </div>
                    <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                      {ticket.solicitante_nome}
                    </p>
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
                      className="ctp-input"
                      style={{ width: 'auto' }}
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
                      className="btn btn-primary"
                    >
                      {savingId === ticket.id ? 'Salvando...' : 'Atribuir'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!loading && tickets.length === 0 && (
            <div className="empty-state">
              <UserCheck size={32} />
              <p>Nenhuma demanda para atribuir.</p>
              <p>Demandas com orçamento aprovado aparecerão aqui.</p>
            </div>
          )}
        </div>
      </section>
    </LayoutShell>
  )
}

